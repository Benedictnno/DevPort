import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { createWorker, QUEUE_NAMES, type RepositoryAnalysisJobData } from "@/shared/queue/client";
import { getGitHubAdapterForUser } from "@/modules/integrations/github/github.service";
import {
  analyzeFileList,
  extractTechnologiesFromPackageJson,
  extractFeaturesFromReadme,
  extractLinksFromReadme,
} from "./analyzer";
import { GroqAdapter } from "@/modules/ai/groq.adapter";
import { ProjectRepository } from "@/modules/projects/project.repository";
import { parseOpenApiSpec } from "@/modules/documentation/openapi.parser";
import { logger } from "@/shared/logger";

const projectRepository = new ProjectRepository();

/**
 * Core repository analysis execution logic.
 */
export async function executeRepositoryAnalysis(
  data: RepositoryAnalysisJobData,
  onProgress?: (percent: number) => Promise<void>
): Promise<void> {
  const { projectId, repositoryId, userId, githubFullName, defaultBranch } = data;

  logger.info("Starting repository analysis", {
    projectId,
    userId,
    repository: githubFullName,
  });

  // Guard against concurrent analysis runs
  const currentProject = await db.project.findUnique({
    where: { id: projectId },
    select: { syncStatus: true },
  });
  if (!currentProject) {
    logger.warn("Project not found, skipping analysis", { projectId });
    return;
  }
  if (currentProject.syncStatus === "SYNCING") {
    logger.warn("Analysis already in progress, skipping duplicate run", { projectId });
    return;
  }

  // Update project sync status to SYNCING
  await db.project.update({
    where: { id: projectId },
    data: { syncStatus: "SYNCING" },
  });

  // Update repository import status to ANALYZING
  await db.gitHubRepository.update({
    where: { id: repositoryId },
    data: { importStatus: "ANALYZING" },
  });

  try {
    const adapter = await getGitHubAdapterForUser(userId);
    const repository = await db.gitHubRepository.findUnique({
      where: { id: repositoryId },
    });

    // 1. Fetch file list
    if (onProgress) await onProgress(10);
    const filePaths = await adapter.getFiles(githubFullName, defaultBranch);
    logger.info(`Fetched ${filePaths.length} files`, { projectId });

    // 2. Deterministic analysis
    if (onProgress) await onProgress(20);
    const analysis = analyzeFileList(filePaths);

    // 3. Fetch README
    if (onProgress) await onProgress(30);
    const readme = await adapter.getReadme(githubFullName, defaultBranch);
    const readmeContent = readme?.content ?? null;

    // 4. Fetch package.json — prefer root, then shallowest found (monorepo support)
    if (onProgress) await onProgress(40);
    let packageJsonContent: string | null = null;
    const packageJsonCandidates = filePaths
      .filter((p) => p === "package.json" || p.endsWith("/package.json"))
      // Sort by path depth (fewer slashes = closer to root)
      .sort((a, b) => (a.split("/").length - b.split("/").length));
    if (packageJsonCandidates.length > 0) {
      const pkgPath = packageJsonCandidates[0]; // shallowest (root preferred)
      const pkgFile = await adapter.getFile(githubFullName, pkgPath, defaultBranch);
      packageJsonContent = pkgFile?.content ?? null;
      if (pkgPath !== "package.json") {
        logger.info(`Using package.json from monorepo path: ${pkgPath}`, { projectId });
      }
    }

    // 5. Fetch and parse OpenAPI specification if detected
    if (analysis.detectedOpenApiFiles.length > 0) {
      for (const openApiFilePath of analysis.detectedOpenApiFiles) {
        try {
          const openApiFile = await adapter.getFile(githubFullName, openApiFilePath, defaultBranch);
          if (openApiFile?.content) {
            const parsedDoc = parseOpenApiSpec(openApiFile.content);
            if (parsedDoc && parsedDoc.endpoints.length > 0) {
              await projectRepository.replaceApiDocumentation(projectId, parsedDoc);
              logger.info(`Imported OpenAPI documentation from ${openApiFilePath}`, {
                projectId,
                endpointCount: parsedDoc.endpoints.length,
              });
              break; // successfully imported
            }
          }
        } catch (err) {
          logger.warn(`Failed to parse OpenAPI file ${openApiFilePath}: ${err}`);
        }
      }
    }

    // 6. Combine technology detection
    const fileTechnologies = analysis.estimatedTechnologies;
    const pkgTechnologies = packageJsonContent
      ? extractTechnologiesFromPackageJson(packageJsonContent)
      : [];
    const allTechnologies = [...new Set([...fileTechnologies, ...pkgTechnologies])];

    // 7. AI extraction
    if (onProgress) await onProgress(60);
    let aiResult = null;
    if (process.env.GROQ_API_KEY) {
      try {
        const ai = new GroqAdapter();
        aiResult = await ai.extractProjectInformation({
          repositoryName: githubFullName,
          repositoryDescription: repository?.description ?? null,
          language: repository?.language ?? null,
          topics: repository?.topics ?? [],
          readmeContent,
          packageJsonContent,
          detectedFiles: filePaths.slice(0, 50),
        });
      } catch (aiError) {
        logger.warn("AI extraction failed, continuing with deterministic analysis", {
          projectId,
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }
    }

    // 8. Apply results to the project
    if (onProgress) await onProgress(80);

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found during analysis`);
    }

    const updates: Record<string, unknown> = {};
    const repoName = githubFullName.split("/")[1];

    if (aiResult) {
      // Only apply AI title if the user hasn't already customised it
      // (i.e. it still matches the raw repo name set on import)
      const titleIsDefault =
        project.title === repoName ||
        project.title === repoName.replace(/-/g, " ") ||
        project.title.toLowerCase() === repoName.toLowerCase();
      if (aiResult.title && titleIsDefault) updates.title = aiResult.title;

      // Only apply AI summary if still at the stub value set during import
      const summaryIsDefault = project.summary === `${repoName} repository` || project.summary === "";
      if (aiResult.summary && summaryIsDefault) updates.summary = aiResult.summary;

      if (aiResult.overview) updates.overview = aiResult.overview;
      if (aiResult.architecture) updates.architecture = aiResult.architecture;
    }

    // Always apply deterministic fallbacks for any missing fields
    // (even when AI ran, it might leave some fields blank)
    if (!updates.overview && (!project.overview || project.overview === "")) {
      if (readmeContent) {
        // Use the README as the overview base
        updates.overview = readmeContent.substring(0, 5000);
      } else if (repository?.description) {
        // Fall back to repository description
        updates.overview = repository.description;
      } else {
        // Generate a minimal overview from what we know
        const techList = allTechnologies.slice(0, 5).join(", ");
        updates.overview = `${repoName} is a ${repository?.language ?? "software"} project${
          techList ? ` built with ${techList}` : ""
        }.`;
      }
    }

    if (!updates.summary && (!project.summary || project.summary === `${repoName} repository`)) {
      if (repository?.description) {
        updates.summary = repository.description;
      }
    }

    if (Object.keys(updates).length > 0) {
      await projectRepository.update(projectId, updates);
    }

    // Apply tech stack (AI-derived or file-detected)
    const technologies =
      aiResult?.technologies && aiResult.technologies.length > 0
        ? aiResult.technologies
        : allTechnologies;

    if (technologies.length > 0) {
      await projectRepository.replaceTechStack(
        projectId,
        technologies,
        aiResult ? "AI" : "GITHUB"
      );
    }

    // Apply features (AI-extracted, README-parsed, or generated from file analysis)
    let features =
      aiResult?.features && aiResult.features.length > 0
        ? aiResult.features
        : extractFeaturesFromReadme(readmeContent);

    // If still no features and we have tech stack data, generate basic feature entries
    if (features.length === 0 && allTechnologies.length > 0) {
      features = allTechnologies.slice(0, 5).map((tech) => ({
        title: tech,
        description: `Built with ${tech}`,
      }));
    }

    if (features.length > 0) {
      await projectRepository.replaceFeatures(projectId, features);
    }

    // Apply external links (GitHub repo + links from README)
    const extractedLinks = extractLinksFromReadme(
      readmeContent,
      repository?.url ?? `https://github.com/${githubFullName}`
    );

    if (extractedLinks.length > 0) {
      await projectRepository.replaceLinks(projectId, extractedLinks);
    }

    // Store README as a project source
    if (readmeContent) {
      await db.projectSource.upsert({
        where: {
          projectId_type: { projectId, type: "README" },
        },
        create: {
          projectId,
          type: "README",
          rawData: { content: readmeContent.substring(0, 50000) },
          syncedAt: new Date(),
        },
        update: {
          rawData: { content: readmeContent.substring(0, 50000) },
          syncedAt: new Date(),
        },
      });
    }

    // Mark repository as complete
    if (onProgress) await onProgress(100);
    await db.gitHubRepository.update({
      where: { id: repositoryId },
      data: { importStatus: "COMPLETE", analyzedAt: new Date() },
    });

    // Update project sync status to IDLE and READY
    await db.project.update({
      where: { id: projectId },
      data: { syncStatus: "IDLE", lastSyncedAt: new Date(), status: "READY" },
    });

    logger.info("Repository analysis complete", { projectId });
  } catch (error) {
    logger.error("Repository analysis failed", {
      projectId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Safely update failure state — project/repo may have been deleted mid-flight
    const isRecordMissing = (e: unknown) =>
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "P2025";

    await db.gitHubRepository.update({
      where: { id: repositoryId },
      data: { importStatus: "FAILED" },
    }).catch((e) => {
      if (!isRecordMissing(e)) throw e;
      logger.warn("Repository row missing during error cleanup", { repositoryId });
    });

    await db.project.update({
      where: { id: projectId },
      data: { syncStatus: "ERROR" },
    }).catch((e) => {
      if (!isRecordMissing(e)) throw e;
      logger.warn("Project row missing during error cleanup — likely deleted mid-analysis", { projectId });
    });

    throw error;
  }
}

async function processRepositoryAnalysis(
  job: Job<RepositoryAnalysisJobData>
): Promise<void> {
  return executeRepositoryAnalysis(job.data, (percent) => job.updateProgress(percent));
}

/**
 * Start the repository analysis worker.
 * Call this from your worker process entry point.
 */
export function startRepositoryAnalysisWorker() {
  const worker = createWorker<RepositoryAnalysisJobData>(
    QUEUE_NAMES.REPOSITORY_ANALYSIS,
    processRepositoryAnalysis,
    { concurrency: 3 }
  );

  worker.on("completed", (job) => {
    logger.info("Analysis job completed", { jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    logger.error("Analysis job failed", {
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
}

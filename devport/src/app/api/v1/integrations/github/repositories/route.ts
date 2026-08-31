import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse, ConflictError } from "@/shared/errors";
import { listGitHubRepositories, getGitHubIntegrationStatus, findImportedRepository } from "@/modules/integrations/github/github.service";
import { validate, importRepositorySchema } from "@/shared/validation/schemas";
import { db } from "@/lib/db";
import { createQueue, QUEUE_NAMES, type RepositoryAnalysisJobData } from "@/shared/queue/client";
import { ProjectRepository } from "@/modules/projects/project.repository";

const projectRepository = new ProjectRepository();

// GET /api/v1/integrations/github/repositories
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const [repos, status] = await Promise.all([
      listGitHubRepositories(session.user.id),
      getGitHubIntegrationStatus(session.user.id),
    ]);

    return NextResponse.json({
      repositories: repos,
      integration: status,
    });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

// POST /api/v1/integrations/github/repositories — import a repository
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const input = validate(importRepositorySchema, body);

    // Prevent duplicate imports
    const existing = await findImportedRepository(session.user.id, input.githubId);
    if (existing) {
      throw new ConflictError(
        `Repository "${input.fullName}" has already been imported`
      );
    }

    // Find or sync the user's GitHub integration
    let integration = await db.integration.findFirst({
      where: { userId: session.user.id, provider: "GITHUB", status: "ACTIVE" },
    });

    if (!integration) {
      const account = await db.account.findFirst({
        where: { userId: session.user.id, provider: "github" },
      });
      if (account?.access_token) {
        const { saveGitHubIntegration } = await import(
          "@/modules/integrations/github/github.service"
        );
        await saveGitHubIntegration(session.user.id, {
          accessToken: account.access_token,
          providerAccountId: account.providerAccountId,
          providerAccountName: "github-user",
          scopes: account.scope ?? undefined,
        });
        integration = await db.integration.findFirst({
          where: { userId: session.user.id, provider: "GITHUB", status: "ACTIVE" },
        });
      }
    }

    if (!integration) {
      return NextResponse.json(
        { error: { code: "INTEGRATION_ERROR", message: "GitHub is not connected" } },
        { status: 400 }
      );
    }

    // Generate a slug from the repo name
    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slug = baseSlug;
    let attempt = 0;
    while (await projectRepository.slugExists(slug)) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Create the project draft
    const project = await projectRepository.create({
      owner: { connect: { id: session.user.id } },
      slug,
      title: input.name,
      summary: input.description ?? `${input.name} repository`,
      overview: "",
      status: "DRAFT",
      visibility: "PRIVATE",
      syncStatus: "SYNCING",
    });

    // Create the GitHub repository record
    const repository = await db.gitHubRepository.create({
      data: {
        integrationId: integration.id,
        projectId: project.id,
        githubId: input.githubId,
        fullName: input.fullName,
        name: input.name,
        owner: input.owner,
        description: input.description,
        defaultBranch: input.defaultBranch,
        language: input.language,
        topics: input.topics,
        isPrivate: input.isPrivate,
        url: input.url,
        cloneUrl: input.cloneUrl,
        importStatus: "PENDING",
      },
    });

    // Store GitHub as a project source
    await db.projectSource.create({
      data: {
        projectId: project.id,
        type: "GITHUB",
        externalId: String(input.githubId),
        externalUrl: input.url,
        syncedAt: new Date(),
      },
    });

    // Queue the analysis job (with in-process fallback if Redis is offline)
    const jobData: RepositoryAnalysisJobData = {
      projectId: project.id,
      repositoryId: repository.id,
      userId: session.user.id,
      githubFullName: input.fullName,
      defaultBranch: input.defaultBranch,
    };

    // Import worker execution logic
    const { executeRepositoryAnalysis } = await import("@/jobs/repository-analysis/worker");

    // 1. Always execute in-process analysis in background immediately
    executeRepositoryAnalysis(jobData).catch((err) => {
      console.error("Immediate repository analysis failed:", err);
    });

    // 2. Also push to BullMQ queue for distributed workers if available
    try {
      const queue = createQueue<RepositoryAnalysisJobData>(
        QUEUE_NAMES.REPOSITORY_ANALYSIS
      );
      await queue.add("analyze-repository", jobData, {
        jobId: `repo-analysis-${project.id}`,
      });
    } catch {
      // Redis queue offline / fallback already executing above
    }

    return NextResponse.json(
      {
        project: {
          id: project.id,
          slug: project.slug,
          title: project.title,
          status: project.status,
          syncStatus: project.syncStatus,
        },
        message: "Repository import started. Analysis is running in the background.",
      },
      { status: 202 }
    );
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

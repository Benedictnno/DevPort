import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectRepository } from "@/modules/projects/project.repository";
import { executeRepositoryAnalysis } from "@/jobs/repository-analysis/worker";
import { toProjectDto } from "@/modules/projects/project.dto";
import { toErrorResponse, NotFoundError } from "@/shared/errors";
import { logger } from "@/shared/logger";

const projectRepository = new ProjectRepository();

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const project = await projectRepository.findBySlugAndOwner(slug, session.user.id);
    if (!project) throw new NotFoundError("Project");

    const repo = await db.gitHubRepository.findFirst({ where: { projectId: project.id } });

    if (!repo) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "No connected GitHub repository found" } },
        { status: 400 }
      );
    }

    logger.info("Manual sync triggered", { projectId: project.id, slug, userId: session.user.id, repository: repo.fullName });

    await executeRepositoryAnalysis({
      projectId: project.id,
      repositoryId: repo.id,
      userId: session.user.id,
      githubFullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
    });

    const updatedProject = await projectRepository.findBySlugAndOwner(slug, session.user.id);
    if (!updatedProject) throw new NotFoundError("Project");

    return NextResponse.json({ project: toProjectDto(updatedProject), message: "Repository re-synchronized successfully." });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
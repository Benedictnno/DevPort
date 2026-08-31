import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectRepository } from "@/modules/projects/project.repository";
import { executeRepositoryAnalysis } from "@/jobs/repository-analysis/worker";
import { toProjectDto } from "@/modules/projects/project.dto";
import { toErrorResponse, NotFoundError, AuthorizationError } from "@/shared/errors";

const projectRepository = new ProjectRepository();

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/v1/projects/:slug/ai — Trigger AI analysis & enrichment
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
    if (!project) {
      throw new NotFoundError("Project");
    }

    const repo = await db.gitHubRepository.findFirst({
      where: { projectId: project.id },
    });

    if (!repo) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "No connected GitHub repository found for this project",
          },
        },
        { status: 400 }
      );
    }

    // Execute analysis with Groq AI
    await executeRepositoryAnalysis({
      projectId: project.id,
      repositoryId: repo.id,
      userId: session.user.id,
      githubFullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
    });

    const updatedProject = await projectRepository.findBySlugAndOwner(slug, session.user.id);
    if (!updatedProject) {
      throw new NotFoundError("Project");
    }

    return NextResponse.json({
      project: toProjectDto(updatedProject),
      message: "AI analysis and metadata extraction completed successfully.",
    });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

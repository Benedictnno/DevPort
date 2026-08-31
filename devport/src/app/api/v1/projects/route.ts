import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/shared/errors";
import { validate, createProjectSchema } from "@/shared/validation/schemas";
import * as projectService from "@/modules/projects/project.service";

// GET /api/v1/projects — list user's projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const projects = await projectService.listProjects(session.user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

// POST /api/v1/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const input = validate(createProjectSchema, body);
    const project = await projectService.createProject(session.user.id, input);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

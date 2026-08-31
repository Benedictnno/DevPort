import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/shared/errors";
import { validate, updateProjectSchema } from "@/shared/validation/schemas";
import * as projectService from "@/modules/projects/project.service";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/v1/projects/:slug
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const project = await projectService.getProject(slug, session.user.id);
    return NextResponse.json({ project });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

// PATCH /api/v1/projects/:slug
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const input = validate(updateProjectSchema, body);
    const project = await projectService.updateProject(slug, session.user.id, input);
    return NextResponse.json({ project });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

// DELETE /api/v1/projects/:slug
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    await projectService.deleteProject(slug, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

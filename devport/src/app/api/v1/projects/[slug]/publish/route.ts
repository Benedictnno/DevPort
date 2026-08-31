import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/shared/errors";
import * as projectService from "@/modules/projects/project.service";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/v1/projects/:slug/publish
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const project = await projectService.publishProject(slug, session.user.id);
    return NextResponse.json({ project });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/shared/errors";
import * as projectService from "@/modules/projects/project.service";
import { db } from "@/lib/db";
import { hashApiKey } from "@/shared/crypto";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * GET /api/v1/public/projects/:slug
 * 
 * Public endpoint — no session required.
 * Accepts optional API key for accessing private project data in future.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check for API key authentication
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const rawKey = authHeader.replace("Bearer ", "");
      const keyHash = hashApiKey(rawKey);

      const apiKey = await db.apiKey.findFirst({
        where: {
          keyHash,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { user: { select: { id: true } } },
      });

      if (apiKey) {
        // Update last used timestamp
        await db.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        // Authenticated via API key — return full project if owned by key's user
        const project = await projectService.getProject(slug, apiKey.user.id);
        return NextResponse.json({ project });
      }
    }

    // Unauthenticated — only return public projects
    const project = await projectService.getPublicProject(slug);
    return NextResponse.json({ project });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

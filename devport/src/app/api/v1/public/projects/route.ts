import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/shared/errors";
import * as projectService from "@/modules/projects/project.service";
import { db } from "@/lib/db";
import { hashApiKey } from "@/shared/crypto";

/**
 * GET /api/v1/public/projects
 *
 * Unauthenticated: returns all PUBLIC + PUBLISHED projects (paginated).
 *
 * With a valid API key (Bearer token):
 *   - Returns the key owner's projects.
 *   - If the key has a projectSlugs allowlist, only those slugs are returned.
 *   - Key must have the `projects:read` scope.
 *
 * Query params:
 *   ?limit=20   — max items per page (default 20, max 100)
 *   ?cursor=... — id of last item from previous page
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(parseInt(limitParam ?? "20", 10) || 20, 100);

    // ── API key authentication ───────────────────────────────────────────────
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
        if (!apiKey.scopes.includes("projects:read")) {
          return NextResponse.json(
            {
              error: {
                code: "AUTHORIZATION_ERROR",
                message: "API key lacks the projects:read scope",
              },
            },
            { status: 403 }
          );
        }

        // Record usage
        await db.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        // Return owner projects, filtered by allowlist if set
        const projects = await projectService.listProjectsByOwnerAndSlugs(
          apiKey.user.id,
          apiKey.projectSlugs
        );
        return NextResponse.json({ projects });
      }
    }

    // ── Unauthenticated — return public projects only ────────────────────────
    const projects = await projectService.listPublicProjects({ limit, cursor });
    return NextResponse.json({ projects });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

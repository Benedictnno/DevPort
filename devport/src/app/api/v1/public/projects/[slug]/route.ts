import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/shared/errors";
import * as projectService from "@/modules/projects/project.service";
import { db } from "@/lib/db";
import { hashApiKey } from "@/shared/crypto";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * GET /api/v1/public/projects/:slug
 *
 * Unauthenticated: returns the project only if it is PUBLIC + PUBLISHED.
 *
 * With a valid API key (Bearer token):
 *   - Returns any project owned by the key's user (public or private).
 *   - If the key has a projectSlugs allowlist and this slug is NOT in it,
 *     responds 403 — the key cannot access this project.
 *   - Key must have the `projects:read` scope.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // ── API key authentication ─────────────────────────────────────────────
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
        // Scope check
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

        // Project allowlist check — if the key has restrictions, enforce them (case-insensitively)
        const isAllowed =
          apiKey.projectSlugs.length === 0 ||
          apiKey.projectSlugs.some(
            (s) => s.toLowerCase() === slug.toLowerCase()
          );

        if (!isAllowed) {
          return NextResponse.json(
            {
              error: {
                code: "AUTHORIZATION_ERROR",
                message: "API key does not have access to this project",
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

        // Authenticated via API key — return full project if owned by key's user
        const project = await projectService.getProject(slug, apiKey.user.id);
        return NextResponse.json({ project });
      }
    }

    // ── Unauthenticated — only return public projects ──────────────────────
    const project = await projectService.getPublicProject(slug);
    return NextResponse.json({ project });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

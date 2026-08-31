import { db } from "@/lib/db";
import { GitHubAdapter } from "./github.adapter";
import { decryptToken } from "@/shared/crypto";
import { NotFoundError, IntegrationError } from "@/shared/errors";
import { logger } from "@/shared/logger";
import type { RemoteRepository } from "./github.provider";

// ─── GitHub Service ─────────────────────────────────────────────────────────

/**
 * Get the GitHub adapter for a user by loading their stored OAuth token.
 * Throws if no GitHub integration exists.
 */
/**
 * Get the GitHub adapter for a user by loading their stored OAuth token.
 * Checks Integration table first, then falls back to Account table.
 */
export async function getGitHubAdapterForUser(
  userId: string
): Promise<GitHubAdapter> {
  const integration = await db.integration.findFirst({
    where: { userId, provider: "GITHUB", status: "ACTIVE" },
  });

  if (integration?.accessTokenHash) {
    // Decrypt the stored access token
    const accessToken = decryptToken(integration.accessTokenHash);
    return new GitHubAdapter(accessToken);
  }

  // Fallback: check if the user signed in with GitHub and token is in Account table
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
  });

  if (account?.access_token) {
    // Auto-sync into Integration table for future use
    await saveGitHubIntegration(userId, {
      accessToken: account.access_token,
      providerAccountId: account.providerAccountId,
      providerAccountName: "github-user",
      scopes: account.scope ?? undefined,
    });
    return new GitHubAdapter(account.access_token);
  }

  throw new IntegrationError(
    "GitHub is not connected. Please connect your GitHub account first.",
    "github"
  );
}

/**
 * List repositories accessible to the authenticated user's GitHub account.
 */
export async function listGitHubRepositories(
  userId: string
): Promise<RemoteRepository[]> {
  const adapter = await getGitHubAdapterForUser(userId);
  return adapter.listRepositories();
}

/**
 * Store or update the GitHub integration for a user.
 * Called after OAuth callback.
 */
export async function saveGitHubIntegration(
  userId: string,
  data: {
    accessToken: string;
    providerAccountId: string;
    providerAccountName: string;
    scopes?: string;
  }
): Promise<void> {
  const { encryptToken } = await import("@/shared/crypto");
  const encryptedToken = encryptToken(data.accessToken);

  await db.integration.upsert({
    where: {
      userId_provider: { userId, provider: "GITHUB" },
    },
    create: {
      userId,
      provider: "GITHUB",
      status: "ACTIVE",
      accessTokenHash: encryptedToken,
      providerAccountId: data.providerAccountId,
      providerAccountName: data.providerAccountName,
      scopes: data.scopes,
    },
    update: {
      status: "ACTIVE",
      accessTokenHash: encryptedToken,
      providerAccountId: data.providerAccountId,
      providerAccountName: data.providerAccountName,
      scopes: data.scopes,
    },
  });

  logger.info("GitHub integration saved", { userId });
}

/**
 * Check if a GitHub repository is already imported for this user.
 */
export async function findImportedRepository(
  userId: string,
  githubId: number
): Promise<{ projectId: string } | null> {
  const integration = await db.integration.findFirst({
    where: { userId, provider: "GITHUB" },
    include: {
      repositories: {
        where: { githubId },
        select: { projectId: true },
      },
    },
  });

  if (!integration) return null;
  const repo = integration.repositories[0];
  if (!repo?.projectId) return null;
  return { projectId: repo.projectId };
}

/**
 * Get the status of a user's GitHub connection.
 */
export async function getGitHubIntegrationStatus(userId: string): Promise<{
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
}> {
  const integration = await db.integration.findFirst({
    where: { userId, provider: "GITHUB" },
    select: {
      status: true,
      providerAccountName: true,
      connectedAt: true,
    },
  });

  if (integration && integration.status === "ACTIVE") {
    return {
      connected: true,
      accountName: integration.providerAccountName ?? undefined,
      connectedAt: integration.connectedAt.toISOString(),
    };
  }

  // Fallback: check Account table
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: {
      access_token: true,
      providerAccountId: true,
      createdAt: true,
    },
  });

  if (account?.access_token) {
    return {
      connected: true,
      accountName: "GitHub Linked",
      connectedAt: account.createdAt.toISOString(),
    };
  }

  return { connected: false };
}

/**
 * Disconnect GitHub integration for a user.
 */
export async function disconnectGitHub(userId: string): Promise<void> {
  const integration = await db.integration.findFirst({
    where: { userId, provider: "GITHUB" },
  });

  if (!integration) {
    throw new NotFoundError("GitHub integration");
  }

  await db.integration.update({
    where: { id: integration.id },
    data: { status: "DISCONNECTED", accessTokenHash: null },
  });

  logger.info("GitHub integration disconnected", { userId });
}

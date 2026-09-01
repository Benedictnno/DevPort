import { Octokit } from "@octokit/rest";
import type {
  SourceControlProvider,
  RemoteRepository,
  RepositoryFile,
  WebhookConfig,
  CreatedWebhook,
} from "./github.provider";
import { IntegrationError } from "@/shared/errors";
import { logger } from "@/shared/logger";

export class GitHubAdapter implements SourceControlProvider {
  private readonly octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async listRepositories(): Promise<RemoteRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
        affiliation: "owner,collaborator",
      });
      return data.map(mapOctokitRepo);
    } catch (error) {
      throw new IntegrationError(
        `Failed to list GitHub repositories: ${errorMessage(error)}`,
        "github"
      );
    }
  }

  async getRepository(fullName: string): Promise<RemoteRepository> {
    try {
      const [owner, repo] = fullName.split("/");
      const { data } = await this.octokit.repos.get({ owner, repo });
      return mapOctokitRepo(data);
    } catch (error) {
      throw new IntegrationError(
        `Failed to get GitHub repository "${fullName}": ${errorMessage(error)}`,
        "github"
      );
    }
  }

  async getReadme(
    fullName: string,
    branch?: string
  ): Promise<RepositoryFile | null> {
    try {
      const [owner, repo] = fullName.split("/");
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
        ...(branch && { ref: branch }),
      });

      return {
        path: data.path,
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        encoding: "utf-8",
      };
    } catch (error: unknown) {
      // 404 means no README — that's fine
      if (isNotFoundError(error)) return null;
      throw new IntegrationError(
        `Failed to get README for "${fullName}": ${errorMessage(error)}`,
        "github"
      );
    }
  }

  async getFile(
    fullName: string,
    path: string,
    branch?: string
  ): Promise<RepositoryFile | null> {
    try {
      const [owner, repo] = fullName.split("/");
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ...(branch && { ref: branch }),
      });

      if (Array.isArray(data) || data.type !== "file") return null;

      const content =
        data.encoding === "base64"
          ? Buffer.from(data.content, "base64").toString("utf-8")
          : data.content;

      return { path: data.path, content, encoding: "utf-8" };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw new IntegrationError(
        `Failed to get file "${path}" from "${fullName}": ${errorMessage(error)}`,
        "github"
      );
    }
  }

  async getFiles(fullName: string, branch?: string): Promise<string[]> {
    try {
      const [owner, repo] = fullName.split("/");
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch ?? "HEAD",
        recursive: "1",
      });

      return data.tree
        .filter((item) => item.type === "blob" && item.path)
        .map((item) => item.path!)
        .filter(
          (path) =>
            // Exclude large binary/generated directories
            !path.startsWith("node_modules/") &&
            !path.startsWith(".git/") &&
            !path.startsWith("dist/") &&
            !path.startsWith("build/") &&
            !path.startsWith(".next/")
        );
    } catch (error) {
      // Rate limit or auth failure — surface as retryable error
      if (isRateLimitError(error)) {
        throw new IntegrationError(
          `GitHub rate limit exceeded while listing files for "${fullName}". Retry after the limit resets.`,
          "github"
        );
      }
      // Other errors (e.g. empty repo, tree too large) — log and return empty
      logger.warn(`Failed to list files for "${fullName}"`, {
        error: errorMessage(error),
      });
      return [];
    }
  }

  async createWebhook(
    fullName: string,
    config: WebhookConfig
  ): Promise<CreatedWebhook> {
    try {
      const [owner, repo] = fullName.split("/");
      const { data } = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: config.url,
          content_type: "json",
          secret: config.secret,
        },
        events: config.events,
        active: true,
      });

      return {
        id: String(data.id),
        url: data.config?.url ?? config.url,
        active: data.active,
      };
    } catch (error) {
      throw new IntegrationError(
        `Failed to create webhook for "${fullName}": ${errorMessage(error)}`,
        "github"
      );
    }
  }

  async deleteWebhook(fullName: string, webhookId: string): Promise<void> {
    try {
      const [owner, repo] = fullName.split("/");
      await this.octokit.repos.deleteWebhook({
        owner,
        repo,
        hook_id: parseInt(webhookId),
      });
    } catch (error) {
      if (isNotFoundError(error)) return; // Already gone
      throw new IntegrationError(
        `Failed to delete webhook for "${fullName}": ${errorMessage(error)}`,
        "github"
      );
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapOctokitRepo(data: {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null | undefined;
  default_branch: string;
  language: string | null | undefined;
  topics?: string[];
  private: boolean;
  html_url: string;
  clone_url: string;
  pushed_at: string | null | undefined;
  stargazers_count: number;
  forks_count: number;
}): RemoteRepository {
  return {
    id: data.id,
    fullName: data.full_name,
    name: data.name,
    owner: data.owner.login,
    description: data.description ?? null,
    defaultBranch: data.default_branch,
    language: data.language ?? null,
    topics: data.topics ?? [],
    isPrivate: data.private,
    url: data.html_url,
    cloneUrl: data.clone_url,
    lastPushedAt: data.pushed_at ? new Date(data.pushed_at) : null,
    starCount: data.stargazers_count,
    forkCount: data.forks_count,
  };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 404
  );
}

function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    ((error as { status: number }).status === 403 ||
      (error as { status: number }).status === 429)
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// SourceControlProvider interface
// All source control integrations must implement this contract.
// The application depends on this interface, not on specific SDKs.

export interface RepositoryFile {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
}

export interface RemoteRepository {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  url: string;
  cloneUrl: string;
  lastPushedAt: Date | null;
  starCount: number;
  forkCount: number;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
}

export interface CreatedWebhook {
  id: string;
  url: string;
  active: boolean;
}

export interface SourceControlProvider {
  listRepositories(): Promise<RemoteRepository[]>;
  getRepository(fullName: string): Promise<RemoteRepository>;
  getReadme(fullName: string, branch?: string): Promise<RepositoryFile | null>;
  getFile(fullName: string, path: string, branch?: string): Promise<RepositoryFile | null>;
  getFiles(fullName: string, branch?: string): Promise<string[]>; // list of file paths
  createWebhook(fullName: string, config: WebhookConfig): Promise<CreatedWebhook>;
  deleteWebhook(fullName: string, webhookId: string): Promise<void>;
}

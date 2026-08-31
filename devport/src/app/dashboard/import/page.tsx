import { auth } from "@/lib/auth";
import { getGitHubIntegrationStatus } from "@/modules/integrations/github/github.service";
import { GitHubRepositoryPicker } from "@/components/github/repository-picker";
import { ConnectGitHubButton } from "@/components/github/connect-github-button";
import { GitBranch, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Repository",
};

export default async function ImportPage() {
  const session = await auth();
  const githubStatus = await getGitHubIntegrationStatus(session!.user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-on-surface">Import Repository</h1>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
            Provider: GitHub
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Select a repository to import into the DevPort cluster. DevPort will automatically extract README metadata, detect tech stacks, discover OpenAPI specifications, and create a structured project draft.
        </p>
      </div>

      {!githubStatus.connected ? (
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-center mb-4 text-muted-foreground">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-sm text-on-surface mb-1">GitHub Account Not Linked</h2>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            Authorize DevPort to inspect your accessible GitHub repositories, commit trees, and repository metadata.
          </p>
          <ConnectGitHubButton callbackUrl="/dashboard/import" />
        </div>
      ) : (
        <GitHubRepositoryPicker />
      )}
    </div>
  );
}

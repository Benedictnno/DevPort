import { auth } from "@/lib/auth";
import { getGitHubIntegrationStatus } from "@/modules/integrations/github/github.service";
import { Settings, GitBranch, Key, Shield, Bell, Terminal, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cluster Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  const githubStatus = await getGitHubIntegrationStatus(session!.user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-on-surface">Cluster Settings</h1>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
            Config v1.0
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Manage developer credentials, provider integrations, synchronization webhooks, and cluster preferences.
        </p>
      </div>

      {/* Account / User Section */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60 space-y-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface">
          Developer Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
            <input
              type="text"
              readOnly
              value={session?.user?.name ?? "Developer"}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-mono text-on-surface"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address</label>
            <input
              type="text"
              readOnly
              value={session?.user?.email ?? ""}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-mono text-on-surface"
            />
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60 space-y-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface">
          Connected Providers
        </h2>
        <div className="p-4 rounded-lg border border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface">GitHub Integration</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {githubStatus.connected
                  ? `Connected as @${githubStatus.accountName}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          <span
            className={`font-mono text-[10px] px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              githubStatus.connected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-surface-container-highest text-muted-foreground border-outline-variant"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                githubStatus.connected ? "bg-emerald-400" : "bg-muted-foreground"
              }`}
            />
            {githubStatus.connected ? "ACTIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Security & Infrastructure Info */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60 space-y-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface">
          Security & Ingestion Webhooks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 space-y-1">
            <div className="flex items-center gap-2 text-primary font-semibold mb-1">
              <Shield className="w-4 h-4" />
              <span>Payload Signature Verification</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Incoming GitHub and provider webhooks require cryptographic HMAC SHA-256 verification before queuing ingest jobs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <Terminal className="w-4 h-4" />
              <span>Asynchronous BullMQ Worker Pool</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Repository analysis and OpenAPI parsing execute asynchronously on dedicated worker threads with automatic retries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

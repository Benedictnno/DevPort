import { auth } from "@/lib/auth";
import { listApiKeys } from "@/modules/api-keys/api-key.service";
import { ApiKeyManager } from "@/components/api-keys/api-key-manager";
import type { Metadata } from "next";
import { Terminal, Shield, Key } from "lucide-react";

export const metadata: Metadata = {
  title: "API Keys & Access Control",
};

export default async function ApiKeysPage() {
  const session = await auth();
  const keys = await listApiKeys(session!.user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant/60">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-on-surface">API Keys & Tokens</h1>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
            Auth v1.0
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Provision secure bearer tokens to fetch project intelligence, documentation, and metadata in external portfolio apps, CI/CD pipelines, or microservices.
        </p>
      </div>

      {/* Usage Example Terminal */}
      <div className="p-5 rounded-xl border border-outline-variant/60 bg-surface-container">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-xs font-semibold text-on-surface uppercase tracking-wider">
              cURL Request Example
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">HTTP Bearer Authentication</span>
        </div>
        <pre className="p-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs font-mono text-primary overflow-x-auto selection:bg-primary/20">
          <code>{`curl -X GET https://devport.app/api/v1/public/projects/my-project \\
  -H "Authorization: Bearer dp_live_..." \\
  -H "Accept: application/json"`}</code>
        </pre>
      </div>

      <ApiKeyManager initialKeys={keys} />
    </div>
  );
}

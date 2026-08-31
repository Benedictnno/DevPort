"use client";

import { useState } from "react";
import { Key, Plus, Loader2, Trash2, Copy, CheckCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ApiKeyDto } from "@/modules/api-keys/api-key.service";

interface ApiKeyManagerProps {
  initialKeys: ApiKeyDto[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: ["projects:read"] }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      const data = await res.json();
      setNewKeySecret(data.apiKey.key);
      setKeys((prev) => [
        {
          id: data.apiKey.id,
          name: data.apiKey.name,
          prefix: data.apiKey.prefix,
          scopes: data.apiKey.scopes,
          lastUsedAt: null,
          expiresAt: data.apiKey.expiresAt,
          createdAt: data.apiKey.createdAt,
        },
        ...prev,
      ]);
      setNewKeyName("");
      setShowForm(false);
    } catch {
      alert("Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key? Applications using it will immediately lose access.")) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      alert("Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  }

  async function copyKey() {
    if (!newKeySecret) return;
    await navigator.clipboard.writeText(newKeySecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Newly Created Secret Banner */}
      {newKeySecret && (
        <div className="p-5 rounded-xl border border-primary/40 bg-surface-container shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-on-surface">Secret Token Generated</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                Save this secret token immediately. For security, DevPort will never display it again.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2 text-xs font-mono text-primary truncate select-all">
              {newKeySecret}
            </code>
            <button
              onClick={copyKey}
              id="copy-api-key-btn"
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-primary-container text-on-primary-container px-3.5 py-2 rounded-lg hover:brightness-110 transition-all shadow-sm"
            >
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Token"}
            </button>
          </div>
          <button
            onClick={() => setNewKeySecret(null)}
            className="text-[11px] font-mono text-muted-foreground hover:text-on-surface mt-2.5 transition-colors"
          >
            [ Dismiss notice ]
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold text-on-surface uppercase tracking-wider">
          Active Tokens ({keys.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          id="create-api-key-btn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-container text-on-primary-container px-3 py-1.5 rounded-lg hover:brightness-110 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Creation Modal / Form */}
      {showForm && (
        <div className="p-5 rounded-xl border border-outline-variant/60 bg-surface-container animate-in fade-in">
          <p className="text-xs font-semibold text-on-surface mb-3">Provision API Access Token</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Identifier label (e.g. Portfolio Website, Prod-Gateway)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              id="api-key-name-input"
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={createKey}
                disabled={creating || !newKeyName.trim()}
                id="create-api-key-submit-btn"
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary-container text-on-primary-container px-4 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Generate
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-xs font-mono text-muted-foreground hover:text-on-surface border border-outline-variant/60 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key List */}
      {keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center bg-surface-container/40">
          <Key className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-mono text-xs font-medium text-on-surface">No API keys registered</p>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
            Generate an API token to retrieve published project data programmatically.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/60 border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container">
          {keys.map((key) => (
            <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-surface-container-high/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center flex-shrink-0 text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs text-on-surface">{key.name}</p>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 rounded">
                      read:projects
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                    <span className="text-primary font-medium">{key.prefix}••••••••••••</span>
                    <span>created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsedAt && (
                      <span>used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => revokeKey(key.id)}
                disabled={revoking === key.id}
                id={`revoke-key-${key.id}-btn`}
                className="self-end sm:self-center flex items-center gap-1.5 text-xs font-mono text-destructive hover:bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {revoking === key.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Revoke Key
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

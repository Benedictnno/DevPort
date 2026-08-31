"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

interface ConnectGitHubButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function ConnectGitHubButton({
  callbackUrl = "/dashboard/import",
  className,
}: ConnectGitHubButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    await signIn("github", { callbackUrl });
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      id="connect-github-import-btn"
      className={
        className ??
        "inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-lg text-xs font-semibold hover:brightness-110 transition-all shadow-sm disabled:opacity-60"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GitBranch className="w-4 h-4" />
      )}
      <span>{loading ? "Redirecting to GitHub..." : "Authenticate GitHub"}</span>
    </button>
  );
}

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleGitHubSignIn() {
    setLoading(true);
    await signIn("github", { callbackUrl });
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGitHubSignIn}
        disabled={loading}
        id="github-sign-in-btn"
        className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-medium py-2.5 px-4 rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GitHubIcon className="w-4 h-4" />
        )}
        Continue with GitHub
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-background text-muted-foreground">
            GitHub is required to import projects
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        By continuing, you agree to DevPort&apos;s terms of service.
      </p>
    </div>
  );
}

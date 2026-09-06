"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function ProjectEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project editor error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-destructive/30 rounded-2xl max-w-xl mx-auto my-12 shadow-lg">
      <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Failed to load project</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading this project."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs font-mono text-muted-foreground/60">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface-container-high hover:bg-surface-container-highest border border-border rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </Link>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-destructive/30 rounded-2xl max-w-xl mx-auto my-12 shadow-lg">
      <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading the dashboard."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs font-mono text-muted-foreground/60">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface-container-high hover:bg-surface-container-highest border border-border rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

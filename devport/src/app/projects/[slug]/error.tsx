"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function PublicProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public project error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-2xl max-w-lg shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Project Unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this public project."}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface-container-high hover:bg-surface-container-highest border border-border rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
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
    </div>
  );
}

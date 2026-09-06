import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-border flex items-center justify-center mb-6 text-primary shadow-lg">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-mono">
        404
      </h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">
        Resource Not Found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The project, page, or resource you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface-container-high hover:bg-surface-container-highest border border-border rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

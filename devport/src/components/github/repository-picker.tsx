"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  GitBranch,
  Star,
  Lock,
  Loader2,
  ArrowRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

interface Repository {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  url: string;
  cloneUrl: string;
  starCount: number;
  lastPushedAt: string | null;
}

export function GitHubRepositoryPicker() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<number | null>(null);

  const fetchRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/integrations/github/repositories");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to load repositories");
      }
      const data = await res.json();
      setRepositories(data.repositories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const filtered = repositories.filter(
    (repo) =>
      repo.fullName.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
  );

  async function importRepository(repo: Repository) {
    setImporting(repo.id);
    try {
      const res = await fetch("/api/v1/integrations/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubId: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner,
          description: repo.description,
          defaultBranch: repo.defaultBranch,
          language: repo.language,
          topics: repo.topics,
          isPrivate: repo.isPrivate,
          url: repo.url,
          cloneUrl: repo.cloneUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Import failed");
      }

      const data = await res.json();
      router.push(`/dashboard/projects/${data.project.slug}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
      setImporting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-surface-container border border-outline-variant/60">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
        <p className="font-mono text-xs text-muted-foreground">Discovering repositories from GitHub API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-xs font-mono text-destructive mb-3">{error}</p>
        <button
          onClick={fetchRepositories}
          className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry request</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter repositories by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="repo-search-input"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container text-xs text-on-surface placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <span>{filtered.length} accessible repositories</span>
        <button
          onClick={fetchRepositories}
          className="flex items-center gap-1.5 hover:text-on-surface transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync List</span>
        </button>
      </div>

      {/* Repository List */}
      <div className="divide-y divide-outline-variant/60 border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container">
        {filtered.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-muted-foreground">
            No matching repositories found.
          </div>
        ) : (
          filtered.map((repo) => (
            <div
              key={repo.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-surface-container-high/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <GitBranch className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-bold text-xs text-on-surface truncate">{repo.fullName}</span>
                  {repo.isPrivate && (
                    <span className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.2 bg-surface-container-high text-muted-foreground border border-outline-variant/60 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      private
                    </span>
                  )}
                  {repo.language && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant flex-shrink-0">
                      {repo.language}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    branch: {repo.defaultBranch}
                  </span>
                </div>
                {repo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1 pl-6">
                    {repo.description}
                  </p>
                )}
                {repo.starCount > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground pl-6">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span>{repo.starCount.toLocaleString()} stars</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => importRepository(repo)}
                disabled={importing !== null}
                id={`import-repo-${repo.id}-btn`}
                className="self-end sm:self-center flex items-center gap-1.5 text-xs font-semibold bg-primary-container text-on-primary-container px-4 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
              >
                {importing === repo.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Import Repository</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

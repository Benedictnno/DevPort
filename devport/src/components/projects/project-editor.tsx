"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Lock,
  GitBranch,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Trash2,
  BookOpen,
  Zap,
  Link2,
  Code2,
  Terminal,
  Activity,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { ProjectDto } from "@/modules/projects/project.dto";

interface ProjectEditorProps {
  project: ProjectDto;
}

export function ProjectEditor({ project: initial }: ProjectEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "features" | "tech" | "links" | "api">("overview");

  // Form state
  const [title, setTitle] = useState(project.title);
  const [summary, setSummary] = useState(project.summary);
  const [overview, setOverview] = useState(project.overview);
  const [architecture, setArchitecture] = useState(project.architecture ?? "");
  const [productionUrl, setProductionUrl] = useState(project.deployment?.productionUrl ?? "");

  async function triggerAiAnalysis() {
    setAnalyzingAi(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.slug}/ai`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "AI extraction failed");
      }
      const data = await res.json();
      setProject(data.project);
      setTitle(data.project.title);
      setSummary(data.project.summary);
      setOverview(data.project.overview);
      setArchitecture(data.project.architecture ?? "");
      setProductionUrl(data.project.deployment?.productionUrl ?? "");
      alert("AI analysis complete! Project documentation and tech stack updated.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAnalyzingAi(false);
    }
  }

  async function triggerReSync() {
    setSyncingRepo(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.slug}/sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Re-sync failed");
      }
      const data = await res.json();
      setProject(data.project);
      setTitle(data.project.title);
      setSummary(data.project.summary);
      setOverview(data.project.overview);
      setArchitecture(data.project.architecture ?? "");
      setProductionUrl(data.project.deployment?.productionUrl ?? "");
      alert("Re-sync complete! Project data updated from GitHub.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Re-sync failed");
    } finally {
      setSyncingRepo(false);
    }
  }

  const isDirty =
    title !== project.title ||
    summary !== project.summary ||
    overview !== project.overview ||
    architecture !== (project.architecture ?? "") ||
    productionUrl !== (project.deployment?.productionUrl ?? "");

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          overview,
          architecture: architecture || undefined,
          productionUrl: productionUrl.trim() || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setProject(data.project);
    } catch {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function publishProject() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.slug}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish");
      const data = await res.json();
      setProject(data.project);
    } catch {
      alert("Failed to publish project");
    } finally {
      setPublishing(false);
    }
  }

  async function deleteProject() {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard");
    } catch {
      alert("Failed to delete project");
      setDeleting(false);
    }
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BookOpen },
    { id: "features" as const, label: "Features", icon: Zap },
    { id: "tech" as const, label: "Tech Stack", icon: Terminal },
    { id: "links" as const, label: "Links", icon: Link2 },
    { id: "api" as const, label: "API Docs", icon: Code2 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-surface-container border border-outline-variant/60">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl font-bold tracking-tight text-on-surface truncate">
              {project.title}
            </h1>
            <span className="font-mono text-xs text-muted-foreground">
              /{project.slug}
            </span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 border ${
                project.status === "PUBLISHED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : project.status === "READY"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-surface-container-highest text-muted-foreground border-outline-variant"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                project.status === "PUBLISHED"
                  ? "bg-emerald-400"
                  : project.status === "READY"
                  ? "bg-primary"
                  : "bg-muted-foreground"
              }`} />
              {project.status.toLowerCase()}
            </span>
            {project.syncStatus === "SYNCING" && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing Node...
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Project configuration, documentation metadata, and connected integrations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {project.status === "PUBLISHED" && (
            <a
              href={`/projects/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-on-surface bg-surface-container-high border border-outline-variant/60 px-3 py-1.5 rounded-lg hover:border-primary/40 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Public Profile</span>
            </a>
          )}

          {project.repository && (
            <>
              <button
                onClick={triggerReSync}
                disabled={syncingRepo || analyzingAi}
                id="resync-btn"
                title="Re-fetch data from GitHub and re-run analysis"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-muted-foreground border border-outline-variant/60 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                {syncingRepo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{syncingRepo ? "Syncing..." : "Re-sync"}</span>
              </button>
              <button
                onClick={triggerAiAnalysis}
                disabled={analyzingAi || syncingRepo}
                id="ai-analysis-btn"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                {analyzingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{analyzingAi ? "Analyzing..." : "Enhance with AI"}</span>
              </button>
            </>
          )}

          {isDirty && (
            <button
              onClick={saveChanges}
              disabled={saving}
              id="save-project-btn"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-container text-on-primary-container px-4 py-1.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          )}

          {project.status !== "PUBLISHED" && !isDirty && (
            <button
              onClick={publishProject}
              disabled={publishing}
              id="publish-project-btn"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Publish Live
            </button>
          )}
        </div>
      </div>

      {/* Meta Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visibility */}
        <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Visibility</p>
          <div className="flex items-center gap-2 font-mono text-xs">
            {project.visibility === "PUBLIC" ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Globe className="w-3.5 h-3.5" /> Public API & Profile
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="w-3.5 h-3.5" /> Private Infrastructure
              </span>
            )}
          </div>
        </div>

        {/* Repository */}
        <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Repository</p>
          {project.repository ? (
            <a
              href={project.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-primary hover:underline truncate"
            >
              <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.repository.fullName}</span>
            </a>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">Not connected</span>
          )}
        </div>

        {/* Deployment */}
        <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Deployment Target</p>
          {project.deployment?.productionUrl ? (
            <a
              href={project.deployment.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:underline truncate"
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.deployment.productionUrl.replace("https://", "")}</span>
            </a>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">Not configured</span>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-1 border-b border-outline-variant/60 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary bg-surface-container-high/40 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-on-surface hover:bg-surface-container/40"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panel */}
      <div className="p-6 rounded-xl border border-outline-variant/60 bg-surface-container">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-on-surface mb-1.5 block">
                Project Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="project-title-input"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface mb-1.5 block flex justify-between">
                <span>Summary</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {summary.length}/300
                </span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={300}
                id="project-summary-input"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface mb-1.5 block">
                Overview (Markdown)
              </label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={8}
                id="project-overview-input"
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all resize-none"
                placeholder="Describe your project in detail..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface mb-1.5 block">
                Architecture Notes
              </label>
              <textarea
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                rows={4}
                id="project-architecture-input"
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all resize-none"
                placeholder="Describe system design, queue architecture, databases, or third-party integrations..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface mb-1.5 block">
                Live Deployment URL (Vercel / Production)
              </label>
              <input
                type="url"
                value={productionUrl}
                onChange={(e) => setProductionUrl(e.target.value)}
                id="project-deployment-url-input"
                placeholder="https://my-app.vercel.app"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
              />
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div>
            {(project.features ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center bg-surface-container-low/40">
                <Zap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">No features extracted yet.</p>
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                  Features are populated during repository analysis or can be configured via API.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(project.features ?? []).map((feature) => (
                  <div key={feature.id} className="p-4 rounded-lg border border-outline-variant/60 bg-surface-container-low">
                    <p className="font-semibold text-xs text-on-surface">{feature.title}</p>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tech" && (
          <div>
            {(project.technologies ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center bg-surface-container-low/40">
                <Terminal className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">
                  Technologies will be discovered during repository ingestion.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(project.technologies ?? []).map((tech) => (
                  <span
                    key={tech.id}
                    className="font-mono text-xs px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/60 text-on-surface"
                  >
                    {tech.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div>
            {(project.links ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center bg-surface-container-low/40">
                <Link2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">No external links registered.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(project.links ?? []).map((link) => (
                  <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/60 bg-surface-container-low">
                    <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-surface-container-highest uppercase">{link.type}</span>
                    <span className="font-medium text-xs text-on-surface">{link.label}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto font-mono text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {link.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "api" && (
          <div>
            {!project.apiDocs ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center bg-surface-container-low/40">
                <Code2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">
                  No OpenAPI specification attached.
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                  OpenAPI 3.0 / Swagger documents are parsed automatically from connected repos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                  <div>
                    <h3 className="font-bold text-xs text-on-surface">{project.apiDocs.title}</h3>
                    {project.apiDocs.version && (
                      <p className="font-mono text-[10px] text-muted-foreground">Specification version: v{project.apiDocs.version}</p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                    OpenAPI 3.0
                  </span>
                </div>

                <div className="space-y-2">
                  {project.apiDocs.endpoints.map((ep) => (
                    <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/60 bg-surface-container-low font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                        ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        ep.method === "POST" ? "bg-primary/10 text-primary border border-primary/20" :
                        ep.method === "PATCH" || ep.method === "PUT" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        ep.method === "DELETE" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-surface-container-highest text-muted-foreground"
                      }`}>{ep.method}</span>
                      <span className="text-on-surface font-semibold">{ep.path}</span>
                      {ep.summary && (
                        <span className="ml-auto text-xs text-muted-foreground font-sans truncate max-w-xs">{ep.summary}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-destructive">Decommission Project Node</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Removes DevPort metadata and records. External GitHub repositories and deployments will remain untouched.
          </p>
        </div>
        <button
          onClick={deleteProject}
          disabled={deleting}
          id="delete-project-btn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete Project
        </button>
      </div>
    </div>
  );
}

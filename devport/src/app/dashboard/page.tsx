import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  GitBranch,
  Plus,
  ArrowUpRight,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCode2,
  Globe,
  Radio,
  Server,
  Zap,
} from "lucide-react";
import { listProjects } from "@/modules/projects/project.service";
import { getGitHubIntegrationStatus } from "@/modules/integrations/github/github.service";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [projects, githubStatus] = await Promise.all([
    listProjects(userId),
    getGitHubIntegrationStatus(userId),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Engineer";
  const publishedCount = projects.filter((p) => p.status === "PUBLISHED").length;
  const readyCount = projects.filter((p) => p.status === "READY").length;
  const draftCount = projects.filter((p) => p.status === "DRAFT").length;
  const publicCount = projects.filter((p) => p.visibility === "PUBLIC").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Cluster Dashboard
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-surface-container-high border border-outline-variant text-primary rounded">
              node-01
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Welcome back, <span className="text-on-surface font-medium">{firstName}</span>. Manage your projects, repository synchronizations, and exposed APIs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/import"
            id="new-project-btn"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container hover:brightness-110 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Import Repository</span>
          </Link>
        </div>
      </div>

      {/* Infrastructure Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Total Projects</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-on-surface">{projects.length}</span>
            <span className="text-[11px] font-mono text-muted-foreground">active nodes</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Published</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{publishedCount}</span>
            <span className="text-[11px] font-mono text-muted-foreground">public live</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Ready / Draft</span>
            <FileCode2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-on-surface">{readyCount + draftCount}</span>
            <span className="text-[11px] font-mono text-muted-foreground">in staging</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Integration</span>
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${githubStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
            <span className="font-mono text-xs text-on-surface">
              {githubStatus.connected ? "GitHub Synced" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* GitHub connection banner */}
      {!githubStatus.connected ? (
        <div className="p-5 rounded-xl border border-primary/30 bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface">Connect GitHub Provider</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Automatically synchronize repositories, README markdown, OpenAPI specs, and deployment webhooks.
              </p>
            </div>
          </div>
          <Link
            href="/api/auth/signin?provider=github"
            id="connect-github-banner-btn"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-semibold tracking-wide hover:brightness-110 transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Connect GitHub
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-on-surface">GitHub Integration Active</p>
                {githubStatus.accountName && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    @{githubStatus.accountName}
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Automatic webhook ingest & intelligence engine enabled
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
          >
            <span>+ Import Repo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Projects List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-on-surface tracking-tight uppercase font-mono">
              Managed Projects ({projects.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              filter: all
            </span>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/40 flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-muted-foreground mb-4">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-on-surface mb-1">No Projects Registered</p>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              Connect a GitHub repository or create a project profile manually to begin managing your project documentation.
            </p>
            <Link
              href="/dashboard/import"
              className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-semibold hover:brightness-110 transition-all"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Import from GitHub
            </Link>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.slug}`}
                id={`project-card-${project.slug}`}
                className="group p-5 rounded-xl border border-outline-variant/60 bg-surface-container hover:bg-surface-container-high/80 hover:border-primary/50 transition-all duration-150 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Title & Overview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                        {project.title}
                      </h3>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        /{project.slug}
                      </span>

                      {/* Status Badges */}
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

                      {project.visibility === "PUBLIC" && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-primary border border-primary/20">
                          public
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                      {project.summary}
                    </p>

                    {/* Tech Stack Chips */}
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {project.technologies.slice(0, 5).map((tech) => (
                          <span
                            key={tech.id}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                          >
                            {tech.name}
                          </span>
                        ))}
                        {project.technologies.length > 5 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            +{project.technologies.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Repo / Deployment Info & Arrow */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 text-right flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {project.repository && (
                        <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded border border-outline-variant/40">
                          <GitBranch className="w-3 h-3 text-primary" />
                          <span className="max-w-[140px] truncate">{project.repository.fullName}</span>
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                      {project.deployment?.productionUrl && (
                        <span className="text-emerald-400/80 truncate max-w-[180px]">
                          {project.deployment.productionUrl.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                      <span>
                        updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

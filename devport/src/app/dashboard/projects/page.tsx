import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, GitBranch, ArrowUpRight, FolderOpen, Layers, Globe, Server } from "lucide-react";
import { listProjects } from "@/modules/projects/project.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsListPage() {
  const session = await auth();
  const projects = await listProjects(session!.user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-surface-container border border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Registered Projects</h1>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            All project nodes managed by your DevPort instance.
          </p>
        </div>

        <Link
          href="/dashboard/import"
          className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-semibold hover:brightness-110 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Import Repository</span>
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/40 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-mono text-xs text-on-surface font-semibold">No Projects Found</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Import a GitHub repository to get started.
          </p>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-semibold hover:brightness-110 transition-all shadow-sm"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Import from GitHub</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug}`}
              className="group p-5 rounded-xl border border-outline-variant/60 bg-surface-container hover:bg-surface-container-high/80 hover:border-primary/50 transition-all duration-150 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                      {project.title}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">
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

                    {project.visibility === "PUBLIC" && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-primary border border-primary/20">
                        public
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                    {project.summary}
                  </p>

                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {project.technologies.slice(0, 6).map((tech) => (
                        <span
                          key={tech.id}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {project.repository && (
                    <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/40">
                      <GitBranch className="w-3 h-3 text-primary" />
                      <span className="max-w-[140px] truncate">{project.repository.fullName}</span>
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

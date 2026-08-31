import { getPublicProject } from "@/modules/projects/project.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Code2, GitBranch, ExternalLink, ArrowLeft, Zap, Layers } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getPublicProject(slug);
    return {
      title: `${project.title} | DevPort`,
      description: project.summary,
    };
  } catch {
    return { title: "Project Not Found" };
  }
}

export default async function PublicProjectPage({ params }: Props) {
  const { slug } = await params;

  let project;
  try {
    project = await getPublicProject(slug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DevPort
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold">DevPort</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {project.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {project.summary}
          </p>

          {/* Links & actions */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {project.repository && (
              <a
                href={project.repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 border border-border transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                GitHub Repository
              </a>
            )}
            {project.deployment?.productionUrl && (
              <a
                href={project.deployment.productionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Live App
              </a>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        {project.technologies.length > 0 && (
          <div className="mb-10 p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Technologies</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech.id}
                  className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border"
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {project.features.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-lg">Key Features</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {project.features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                  {feature.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview */}
        {project.overview && (
          <div className="mb-10">
            <h2 className="font-semibold text-lg mb-3">Overview</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {project.overview}
            </div>
          </div>
        )}

        {/* Architecture */}
        {project.architecture && (
          <div className="mb-10">
            <h2 className="font-semibold text-lg mb-3">Architecture</h2>
            <div className="p-4 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono text-xs">
              {project.architecture}
            </div>
          </div>
        )}

        {/* API Docs if present */}
        {project.apiDocs && project.apiDocs.endpoints.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">API Reference</h2>
              {project.apiDocs.version && (
                <span className="font-mono text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary border border-border">
                  v{project.apiDocs.version}
                </span>
              )}
            </div>
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
              {project.apiDocs.endpoints.map((ep) => (
                <div key={ep.id} className="p-3.5 flex items-center gap-3 text-xs font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 border ${
                    ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    ep.method === "POST" ? "bg-primary/10 text-primary border-primary/20" :
                    ep.method === "PATCH" || ep.method === "PUT" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    ep.method === "DELETE" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-secondary text-muted-foreground border-border"
                  }`}>
                    {ep.method}
                  </span>
                  <span className="text-foreground font-semibold">{ep.path}</span>
                  {ep.summary && (
                    <span className="ml-auto text-xs text-muted-foreground font-sans truncate max-w-sm">
                      {ep.summary}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

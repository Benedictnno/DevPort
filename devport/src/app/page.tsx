import Link from "next/link";
import { ArrowRight, GitBranch, Zap, Globe, Code2, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">DevPort</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#api" className="hover:text-foreground transition-colors">API</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-8">
            <Star className="w-3 h-3" />
            Developer project intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.05]">
            One place for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
              everything
            </span>{" "}
            about your projects
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect GitHub. DevPort reads your repos, extracts project information,
            and exposes it through an API. Update once, use everywhere.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              <GitBranch className="w-4 h-4" />
              Connect GitHub
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#api"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors border border-border"
            >
              <Code2 className="w-4 h-4" />
              Explore the API
            </Link>
          </div>
        </div>

        {/* Terminal demo */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                GET /api/v1/public/projects/my-app
              </span>
            </div>
            <pre className="p-5 text-sm font-mono text-foreground/90 overflow-x-auto leading-relaxed">
              <code>{`{
  "project": {
    "slug": "my-app",
    "title": "My Awesome App",
    "summary": "A real-time collaboration tool built with Next.js",
    "technologies": [
      { "name": "Next.js" },
      { "name": "TypeScript" },
      { "name": "PostgreSQL" }
    ],
    "features": [
      { "title": "Real-time sync", "description": "..." }
    ],
    "repository": {
      "fullName": "user/my-app",
      "url": "https://github.com/user/my-app"
    },
    "deployment": {
      "productionUrl": "https://my-app.vercel.app",
      "status": "READY"
    }
  }
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything in one place</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              DevPort pulls from your existing tools and builds a structured project profile automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">API-first by design</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Power your portfolio, website, or any app with a single API call.
            No more hardcoding project info everywhere.
          </p>
          <div className="inline-flex items-center gap-2 font-mono text-sm bg-muted border border-border rounded-lg px-4 py-2">
            <span className="text-green-400">GET</span>
            <span className="text-muted-foreground">/api/v1/public/projects/:slug</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Connect GitHub and import your first project in minutes.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <Code2 className="w-3 h-3 text-primary" />
            </div>
            <span>DevPort</span>
          </div>
          <p>Developer project intelligence platform</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description:
      "Connect your GitHub account. DevPort reads your repos, README files, and project configuration automatically.",
  },
  {
    icon: Zap,
    title: "AI-Powered Extraction",
    description:
      "AI analyzes your README and code to generate descriptions, feature lists, and technology stacks. You review everything.",
  },
  {
    icon: Globe,
    title: "Public API",
    description:
      "Expose your project data through a typed API. Power your portfolio or any app without hardcoding project info.",
  },
];

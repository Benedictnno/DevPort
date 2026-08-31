import type { RepositoryFile } from "@/modules/integrations/github/github.provider";

// Files to prioritize for tech stack detection
const MANIFEST_FILES = [
  "package.json",
  "requirements.txt",
  "Pipfile",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "composer.json",
  "Gemfile",
  "*.csproj",
  "pyproject.toml",
];

// OpenAPI file candidates
const OPENAPI_CANDIDATES = [
  "openapi.json",
  "openapi.yaml",
  "openapi.yml",
  "swagger.json",
  "swagger.yaml",
  "swagger.yml",
  "spec.json",
  "spec.yaml",
  "spec.yml",
  "api-spec.json",
  "api-spec.yaml",
  "api-spec.yml",
  "api.json",
  "api.yaml",
  "api.yml",
  "oas.json",
  "oas.yaml",
  "docs/openapi.json",
  "docs/openapi.yaml",
  "docs/swagger.json",
  "docs/swagger.yaml",
  "api/openapi.json",
  "api/openapi.yaml",
];

// Files to always skip (security / irrelevant)
const EXCLUDED_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "*.pem",
  "*.key",
  "credentials.json",
  "service-account.json",
  ".git/",
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "__pycache__/",
];

export interface AnalyzerResult {
  detectedOpenApiFiles: string[];
  detectedManifestFiles: string[];
  packageJsonContent: string | null;
  estimatedTechnologies: string[];
}

/**
 * Analyze repository file list and extract structured information deterministically.
 * This runs before AI processing and provides grounded inputs.
 */
export function analyzeFileList(filePaths: string[]): AnalyzerResult {
  const safeFiles = filePaths.filter(
    (path) => !EXCLUDED_PATHS.some((ex) => path.includes(ex))
  );

  const detectedOpenApiFiles = safeFiles.filter((path) => {
    const lowerPath = path.toLowerCase();
    const fileName = lowerPath.split("/").pop() ?? lowerPath;
    return (
      OPENAPI_CANDIDATES.some((c) => lowerPath.endsWith(c)) ||
      fileName.includes("openapi") ||
      fileName.includes("swagger")
    );
  });

  const detectedManifestFiles = safeFiles.filter((path) =>
    MANIFEST_FILES.some((manifest) => {
      if (manifest.startsWith("*")) {
        return path.endsWith(manifest.replace("*", ""));
      }
      return path.endsWith(`/${manifest}`) || path === manifest;
    })
  );

  const estimatedTechnologies = detectTechnologiesFromFiles(safeFiles);

  return {
    detectedOpenApiFiles,
    detectedManifestFiles,
    packageJsonContent: null, // populated by caller after fetching the file
    estimatedTechnologies,
  };
}

/**
 * Detect technologies based on file presence — fast, no AI needed.
 */
function detectTechnologiesFromFiles(filePaths: string[]): string[] {
  const technologies: string[] = [];
  const fileSet = new Set(filePaths.map((f) => f.toLowerCase()));

  const hasFile = (path: string) => fileSet.has(path.toLowerCase());
  const hasExtension = (ext: string) =>
    [...fileSet].some((f) => f.endsWith(ext));
  const hasDir = (dir: string) =>
    [...fileSet].some((f) => f.startsWith(dir));

  // Languages
  if (hasExtension(".ts") || hasExtension(".tsx")) technologies.push("TypeScript");
  else if (hasExtension(".js") || hasExtension(".jsx")) technologies.push("JavaScript");
  if (hasExtension(".py")) technologies.push("Python");
  if (hasExtension(".go")) technologies.push("Go");
  if (hasExtension(".rs")) technologies.push("Rust");
  if (hasExtension(".java")) technologies.push("Java");
  if (hasExtension(".rb")) technologies.push("Ruby");
  if (hasExtension(".php")) technologies.push("PHP");
  if (hasExtension(".cs")) technologies.push("C#");

  // Frameworks / runtimes (via config files)
  if (hasFile("next.config.js") || hasFile("next.config.ts")) technologies.push("Next.js");
  if (hasFile("vite.config.ts") || hasFile("vite.config.js")) technologies.push("Vite");
  if (hasFile("nuxt.config.ts") || hasFile("nuxt.config.js")) technologies.push("Nuxt.js");
  if (hasFile("remix.config.js")) technologies.push("Remix");
  if (hasFile("svelte.config.js")) technologies.push("SvelteKit");
  if (hasFile("astro.config.mjs") || hasFile("astro.config.ts")) technologies.push("Astro");
  if (hasFile("angular.json")) technologies.push("Angular");
  if (hasFile("vue.config.js")) technologies.push("Vue.js");

  // Backend / infra
  if (hasFile("go.mod")) technologies.push("Go");
  if (hasFile("cargo.toml")) technologies.push("Rust");
  if (hasFile("pom.xml") || hasFile("build.gradle")) technologies.push("Java");
  if (hasFile("dockerfile") || hasFile("docker-compose.yml") || hasFile("docker-compose.yaml")) {
    technologies.push("Docker");
  }
  if (hasDir("kubernetes/") || hasDir("k8s/")) technologies.push("Kubernetes");

  // Databases
  if (hasFile("schema.prisma") || hasDir("prisma/")) technologies.push("Prisma");
  if (hasFile("drizzle.config.ts") || hasFile("drizzle.config.js")) technologies.push("Drizzle ORM");

  // CSS / Styling
  if (hasFile("tailwind.config.js") || hasFile("tailwind.config.ts")) technologies.push("Tailwind CSS");

  // Tooling
  if (hasFile("turbo.json")) technologies.push("Turborepo");
  if (hasFile(".github/workflows/")) technologies.push("GitHub Actions");

  // Deduplicate
  return [...new Set(technologies)];
}

/**
 * Extract technologies from package.json dependencies.
 */
export function extractTechnologiesFromPackageJson(
  content: string
): string[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const technologies: string[] = [];

    const depMap: Record<string, string> = {
      react: "React",
      "react-dom": "React",
      next: "Next.js",
      vue: "Vue.js",
      "@angular/core": "Angular",
      svelte: "Svelte",
      nuxt: "Nuxt.js",
      remix: "Remix",
      astro: "Astro",
      express: "Express.js",
      fastify: "Fastify",
      hono: "Hono",
      nestjs: "NestJS",
      "@nestjs/core": "NestJS",
      prisma: "Prisma",
      "@prisma/client": "Prisma",
      drizzle: "Drizzle ORM",
      mongoose: "Mongoose",
      sequelize: "Sequelize",
      typeorm: "TypeORM",
      tailwindcss: "Tailwind CSS",
      graphql: "GraphQL",
      trpc: "tRPC",
      "@trpc/server": "tRPC",
      zod: "Zod",
      "next-auth": "NextAuth.js",
      "lucia-auth": "Lucia",
      stripe: "Stripe",
      "socket.io": "Socket.io",
      redis: "Redis",
      bullmq: "BullMQ",
      vitest: "Vitest",
      jest: "Jest",
    };

    for (const [dep, label] of Object.entries(depMap)) {
      if (dep in allDeps) {
        technologies.push(label);
      }
    }

    return [...new Set(technologies)];
  } catch {
    return [];
  }
}

/**
 * Extract feature list deterministically from README markdown sections
 */
export function extractFeaturesFromReadme(
  readmeContent: string | null
): Array<{ title: string; description?: string }> {
  if (!readmeContent) return [];

  const features: Array<{ title: string; description?: string }> = [];
  const lines = readmeContent.split("\n");
  let inFeatureSection = false;

  const featureHeaderRegex = /^(?:#+|##|###)\s*(?:✨\s*)?(?:key\s+|core\s+|main\s+)?(?:features|highlights|capabilities|what it does|what is inside)/i;
  const anyHeaderRegex = /^#{1,3}\s+/;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (featureHeaderRegex.test(line)) {
      inFeatureSection = true;
      continue;
    }

    if (inFeatureSection && anyHeaderRegex.test(line)) {
      inFeatureSection = false;
      continue;
    }

    if (inFeatureSection) {
      const bulletMatch = line.match(/^[-*+]\s+(.+)/);
      if (bulletMatch) {
        const text = bulletMatch[1].trim();
        const boldSplit = text.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);
        if (boldSplit) {
          features.push({
            title: boldSplit[1].trim().slice(0, 150),
            description: boldSplit[2]?.trim() ? boldSplit[2].trim().slice(0, 500) : undefined,
          });
        } else {
          const colonIdx = text.indexOf(":");
          const dashIdx = text.indexOf(" - ");
          if (colonIdx > 0 && colonIdx < 50) {
            features.push({
              title: text.slice(0, colonIdx).replace(/\*\*/g, "").trim().slice(0, 150),
              description: text.slice(colonIdx + 1).trim().slice(0, 500),
            });
          } else if (dashIdx > 0 && dashIdx < 50) {
            features.push({
              title: text.slice(0, dashIdx).replace(/\*\*/g, "").trim().slice(0, 150),
              description: text.slice(dashIdx + 3).trim().slice(0, 500),
            });
          } else if (text.length > 3) {
            features.push({
              title: text.replace(/\*\*/g, "").slice(0, 150),
            });
          }
        }
      }
    }
  }

  return features.slice(0, 15);
}

/**
 * Extract links deterministically from README and repository info
 */
export function extractLinksFromReadme(
  readmeContent: string | null,
  repoUrl: string,
  homepageUrl?: string | null
): Array<{ label: string; url: string; type: "GITHUB" | "LIVE" | "DOCS" | "DEMO" | "EXTERNAL" }> {
  const links: Array<{ label: string; url: string; type: "GITHUB" | "LIVE" | "DOCS" | "DEMO" | "EXTERNAL" }> = [];
  const seenUrls = new Set<string>();

  // 1. GitHub repo link
  if (repoUrl) {
    links.push({
      label: "GitHub Repository",
      url: repoUrl,
      type: "GITHUB",
    });
    seenUrls.add(repoUrl.toLowerCase());
  }

  // 2. Repository Homepage if present
  if (homepageUrl && homepageUrl.startsWith("http") && !seenUrls.has(homepageUrl.toLowerCase())) {
    links.push({
      label: "Live Demo / Website",
      url: homepageUrl,
      type: "LIVE",
    });
    seenUrls.add(homepageUrl.toLowerCase());
  }

  // 3. Scan Markdown links in README
  if (readmeContent) {
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = mdLinkRegex.exec(readmeContent)) !== null) {
      const label = match[1].trim();
      const url = match[2].trim();
      const lowerUrl = url.toLowerCase();
      const lowerLabel = label.toLowerCase();

      if (seenUrls.has(lowerUrl)) continue;
      if (lowerUrl.includes("shields.io") || lowerUrl.includes("badge") || label.startsWith("!")) {
        continue;
      }

      let type: "LIVE" | "DOCS" | "DEMO" | "EXTERNAL" = "EXTERNAL";
      if (lowerLabel.includes("demo") || lowerLabel.includes("live") || lowerLabel.includes("preview") || lowerUrl.includes(".vercel.app")) {
        type = "LIVE";
      } else if (lowerLabel.includes("doc") || lowerLabel.includes("guide") || lowerLabel.includes("wiki") || lowerUrl.includes("/docs")) {
        type = "DOCS";
      }

      links.push({
        label: label.slice(0, 60),
        url,
        type,
      });
      seenUrls.add(lowerUrl);
      if (links.length >= 8) break;
    }
  }

  return links;
}


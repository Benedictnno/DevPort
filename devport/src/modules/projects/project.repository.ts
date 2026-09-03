import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────

export const projectFullInclude = Prisma.validator<Prisma.ProjectInclude>()({
  features: { orderBy: { order: "asc" } },
  techStacks: {
    include: { techStack: true },
    orderBy: { order: "asc" },
  },
  links: true,
  media: { orderBy: { order: "asc" } },
  sources: true,
  repository: true,
  deployment: true,
  apiDocs: { include: { endpoints: { orderBy: { order: "asc" } } } },
});

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectFullInclude;
}>;

export const projectSummaryInclude = Prisma.validator<Prisma.ProjectInclude>()({
  techStacks: { include: { techStack: true }, orderBy: { order: "asc" } },
  repository: true,
  deployment: true,
});

export type ProjectSummary = Prisma.ProjectGetPayload<{
  include: typeof projectSummaryInclude;
}>;

// ─── Repository ─────────────────────────────────────────────────────────────

export class ProjectRepository {
  async findById(id: string): Promise<ProjectWithRelations | null> {
    return db.project.findUnique({
      where: { id },
      include: projectFullInclude,
    });
  }

  async findBySlug(slug: string): Promise<ProjectWithRelations | null> {
    return db.project.findUnique({
      where: { slug },
      include: projectFullInclude,
    });
  }

  async findBySlugAndOwner(
    slug: string,
    ownerId: string
  ): Promise<ProjectWithRelations | null> {
    return db.project.findFirst({
      where: { slug, ownerId },
      include: projectFullInclude,
    });
  }

  async findPublicBySlug(slug: string): Promise<ProjectWithRelations | null> {
    return db.project.findFirst({
      where: { slug, visibility: "PUBLIC", status: "PUBLISHED" },
      include: projectFullInclude,
    });
  }

  async listByOwner(ownerId: string): Promise<ProjectSummary[]> {
    return db.project.findMany({
      where: { ownerId },
      include: projectSummaryInclude,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    });
  }

  async listPublic(options?: {
    limit?: number;
    cursor?: string;
  }): Promise<ProjectSummary[]> {
    return db.project.findMany({
      where: { visibility: "PUBLIC", status: "PUBLISHED" },
      include: projectSummaryInclude,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: options?.limit ?? 20,
      ...(options?.cursor && { cursor: { id: options.cursor }, skip: 1 }),
    });
  }

  async create(
    data: Prisma.ProjectCreateInput
  ): Promise<ProjectWithRelations> {
    return db.project.create({
      data,
      include: projectFullInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectUpdateInput
  ): Promise<ProjectWithRelations> {
    return db.project.update({
      where: { id },
      data,
      include: projectFullInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await db.project.delete({ where: { id } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await db.project.count({ where: { slug } });
    return count > 0;
  }

  // ─── Features ──────────────────────────────────────────────────────────

  async replaceFeatures(
    projectId: string,
    features: Array<{ title: string; description?: string | null; order?: number }>
  ) {
    return db.$transaction([
      db.projectFeature.deleteMany({ where: { projectId } }),
      db.projectFeature.createMany({
        data: features.map((f, i) => ({
          projectId,
          title: f.title,
          description: f.description,
          order: f.order ?? i,
        })),
      }),
    ]);
  }

  // ─── Links ─────────────────────────────────────────────────────────────

  async replaceLinks(
    projectId: string,
    links: Array<{ label: string; url: string; type?: string }>
  ) {
    // De-duplicate by URL — keep the first occurrence of each URL
    const seen = new Set<string>();
    const uniqueLinks = links.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    return db.$transaction([
      db.projectLink.deleteMany({ where: { projectId } }),
      db.projectLink.createMany({
        data: uniqueLinks.map((l) => ({
          projectId,
          label: l.label,
          url: l.url,
          type: (l.type as never) ?? "EXTERNAL",
        })),
      }),
    ]);
  }

  // ─── Tech Stack ────────────────────────────────────────────────────────

  async replaceTechStack(
    projectId: string,
    technologies: string[],
    source: "USER" | "AI" | "GITHUB" = "USER"
  ) {
    const validTechs = technologies
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());

    const uniqueTechs = [...new Set(validTechs)];

    return db.$transaction(async (tx) => {
      // Remove existing project<->tech links
      await tx.projectTechStack.deleteMany({ where: { projectId } });

      if (uniqueTechs.length === 0) return;

      // Batch-create any new TechStack rows (skip duplicates for existing names)
      await tx.techStack.createMany({
        data: uniqueTechs.map((name) => ({ name })),
        skipDuplicates: true,
      });

      // Fetch the IDs for all relevant tech stacks in one query
      const techRows = await tx.techStack.findMany({
        where: { name: { in: uniqueTechs } },
        select: { id: true, name: true },
      });

      const nameToId = new Map(techRows.map((t) => [t.name, t.id]));

      // Batch-create all junction rows
      const junctionRows = uniqueTechs
        .map((name, i) => {
          const techStackId = nameToId.get(name);
          if (!techStackId) return null;
          return { projectId, techStackId, source: source as never, order: i };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (junctionRows.length > 0) {
        await tx.projectTechStack.createMany({ data: junctionRows });
      }
    });
  }


  // ─── API Documentation ──────────────────────────────────────────────────

  async replaceApiDocumentation(
    projectId: string,
    doc: {
      title: string;
      version?: string | null;
      description?: string | null;
      baseUrl?: string | null;
      specVersion?: string | null;
      rawSpec?: Record<string, unknown> | null;
      endpoints: Array<{
        method: import("@prisma/client").HttpMethod;
        path: string;
        summary?: string | null;
        description?: string | null;
        tags: string[];
        deprecated?: boolean;
        parameters?: unknown;
        requestSchema?: unknown;
        responseSchema?: unknown;
        order: number;
      }>;
    }
  ) {
    return db.$transaction(async (tx) => {
      // Upsert API documentation container
      const apiDoc = await tx.apiDocumentation.upsert({
        where: { projectId },
        create: {
          projectId,
          title: doc.title,
          version: doc.version,
          description: doc.description,
          baseUrl: doc.baseUrl,
          specVersion: doc.specVersion,
          rawSpec: doc.rawSpec as never,
        },
        update: {
          title: doc.title,
          version: doc.version,
          description: doc.description,
          baseUrl: doc.baseUrl,
          specVersion: doc.specVersion,
          rawSpec: doc.rawSpec as never,
        },
      });

      // Clear old endpoints and recreate
      await tx.apiEndpoint.deleteMany({
        where: { apiDocumentationId: apiDoc.id },
      });

      if (doc.endpoints.length > 0) {
        await tx.apiEndpoint.createMany({
          data: doc.endpoints.map((ep) => ({
            apiDocumentationId: apiDoc.id,
            method: ep.method,
            path: ep.path,
            summary: ep.summary,
            description: ep.description,
            tags: ep.tags,
            deprecated: ep.deprecated ?? false,
            parameters: ep.parameters as never,
            requestSchema: ep.requestSchema as never,
            responseSchema: ep.responseSchema as never,
            order: ep.order,
          })),
        });
      }

      return apiDoc;
    });
  }
}



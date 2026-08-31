import type { ProjectWithRelations, ProjectSummary } from "./project.repository";

// ─── Response DTOs ──────────────────────────────────────────────────────────
// Never expose raw Prisma models through API responses.

export interface ProjectFeatureDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

export interface ProjectLinkDto {
  id: string;
  label: string;
  url: string;
  type: string;
}

export interface TechStackDto {
  id: string;
  name: string;
  iconUrl: string | null;
}

export interface MediaDto {
  id: string;
  url: string;
  type: string;
  altText: string | null;
  order: number;
}

export interface RepositoryDto {
  githubId: number;
  fullName: string;
  name: string;
  owner: string;
  url: string;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  lastPushedAt: string | null;
  importStatus: string;
}

export interface DeploymentDto {
  provider: string;
  productionUrl: string | null;
  status: string;
  lastDeployedAt: string | null;
}

export interface ApiEndpointDto {
  id: string;
  method: string;
  path: string;
  summary: string | null;
  description: string | null;
  tags: string[];
  deprecated: boolean;
}

export interface ApiDocumentationDto {
  title: string;
  version: string | null;
  baseUrl: string | null;
  endpoints: ApiEndpointDto[];
}

export interface ProjectDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  architecture: string | null;
  status: string;
  visibility: string;
  featured: boolean;
  syncStatus: string;
  lastSyncedAt: string | null;
  features: ProjectFeatureDto[];
  technologies: TechStackDto[];
  links: ProjectLinkDto[];
  media: MediaDto[];
  repository: RepositoryDto | null;
  deployment: DeploymentDto | null;
  apiDocs: ApiDocumentationDto | null;
  createdAt: string;
  updatedAt: string;
}

// Public DTO — a subset of ProjectDto for unauthenticated access
export type PublicProjectDto = Omit<ProjectDto, "id" | "visibility" | "syncStatus" | "lastSyncedAt">;

// Summary DTO — used in list views
export interface ProjectSummaryDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  visibility: string;
  featured: boolean;
  technologies: TechStackDto[];
  repository: Pick<RepositoryDto, "fullName" | "language" | "url"> | null;
  deployment: Pick<DeploymentDto, "productionUrl" | "status"> | null;
  updatedAt: string;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

export function toProjectDto(project: ProjectWithRelations): ProjectDto {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    overview: project.overview,
    architecture: project.architecture,
    status: project.status,
    visibility: project.visibility,
    featured: project.featured,
    syncStatus: project.syncStatus,
    lastSyncedAt: project.lastSyncedAt?.toISOString() ?? null,
    features: project.features.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      order: f.order,
    })),
    technologies: project.techStacks.map(({ techStack }) => ({
      id: techStack.id,
      name: techStack.name,
      iconUrl: techStack.iconUrl,
    })),
    links: project.links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      type: l.type,
    })),
    media: project.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      altText: m.altText,
      order: m.order,
    })),
    repository: project.repository
      ? {
          githubId: project.repository.githubId,
          fullName: project.repository.fullName,
          name: project.repository.name,
          owner: project.repository.owner,
          url: project.repository.url,
          language: project.repository.language,
          topics: project.repository.topics,
          isPrivate: project.repository.isPrivate,
          lastPushedAt: project.repository.lastPushedAt?.toISOString() ?? null,
          importStatus: project.repository.importStatus,
        }
      : null,
    deployment: project.deployment
      ? {
          provider: project.deployment.provider,
          productionUrl: project.deployment.productionUrl,
          status: project.deployment.status,
          lastDeployedAt: project.deployment.lastDeployedAt?.toISOString() ?? null,
        }
      : null,
    apiDocs: project.apiDocs
      ? {
          title: project.apiDocs.title,
          version: project.apiDocs.version,
          baseUrl: project.apiDocs.baseUrl,
          endpoints: project.apiDocs.endpoints.map((e) => ({
            id: e.id,
            method: e.method,
            path: e.path,
            summary: e.summary,
            description: e.description,
            tags: e.tags,
            deprecated: e.deprecated,
          })),
        }
      : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toPublicProjectDto(project: ProjectWithRelations): PublicProjectDto {
  const dto = toProjectDto(project);
  const { id: _id, visibility: _vis, syncStatus: _ss, lastSyncedAt: _ls, ...publicFields } = dto;
  return publicFields;
}

export function toProjectSummaryDto(project: ProjectSummary): ProjectSummaryDto {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    status: project.status,
    visibility: project.visibility,
    featured: project.featured,
    technologies: project.techStacks.map(({ techStack }) => ({
      id: techStack.id,
      name: techStack.name,
      iconUrl: techStack.iconUrl,
    })),
    repository: project.repository
      ? {
          fullName: project.repository.fullName,
          language: project.repository.language,
          url: project.repository.url,
        }
      : null,
    deployment: project.deployment
      ? {
          productionUrl: project.deployment.productionUrl,
          status: project.deployment.status,
        }
      : null,
    updatedAt: project.updatedAt.toISOString(),
  };
}

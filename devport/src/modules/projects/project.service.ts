import { db } from "@/lib/db";
import { ProjectRepository } from "./project.repository";
import {
  toProjectDto,
  toProjectSummaryDto,
  toPublicProjectDto,
  type ProjectDto,
  type ProjectSummaryDto,
  type PublicProjectDto,
} from "./project.dto";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "@/shared/errors";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/shared/validation/schemas";

const projectRepository = new ProjectRepository();

// ─── Use Cases ──────────────────────────────────────────────────────────────

/**
 * List all projects owned by a user.
 */
export async function listProjects(userId: string): Promise<ProjectSummaryDto[]> {
  const projects = await projectRepository.listByOwner(userId);
  return projects.map(toProjectSummaryDto);
}

/**
 * Get a project by slug, enforcing ownership.
 */
export async function getProject(
  slug: string,
  userId: string
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) {
    throw new NotFoundError("Project");
  }
  return toProjectDto(project);
}

/**
 * Get a publicly visible project. No auth required.
 */
export async function getPublicProject(slug: string): Promise<PublicProjectDto> {
  const project = await projectRepository.findPublicBySlug(slug);
  if (!project) {
    throw new NotFoundError("Project");
  }
  return toPublicProjectDto(project);
}

/**
 * List all publicly visible, published projects.
 */
export async function listPublicProjects(options?: {
  limit?: number;
  cursor?: string;
}): Promise<ProjectSummaryDto[]> {
  const projects = await projectRepository.listPublic(options);
  return projects.map(toProjectSummaryDto);
}

/**
 * Create a new project for a user.
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<ProjectDto> {
  // Enforce slug uniqueness
  const slugTaken = await projectRepository.slugExists(input.slug);
  if (slugTaken) {
    throw new ConflictError(`Slug "${input.slug}" is already taken`);
  }

  const project = await projectRepository.create({
    owner: { connect: { id: userId } },
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    overview: input.overview ?? "",
    architecture: input.architecture,
    visibility: (input.visibility as never) ?? "PRIVATE",
  });

  return toProjectDto(project);
}

/**
 * Update an existing project. Only the owner may update.
 */
export async function updateProject(
  slug: string,
  userId: string,
  input: UpdateProjectInput
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  if (input.productionUrl !== undefined) {
    if (input.productionUrl && input.productionUrl.trim() !== "") {
      await db.deployment.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          provider: "VERCEL",
          productionUrl: input.productionUrl.trim(),
          status: "READY",
        },
        update: {
          productionUrl: input.productionUrl.trim(),
          status: "READY",
        },
      });
    } else {
      await db.deployment.deleteMany({
        where: { projectId: project.id },
      });
    }
  }

  const updated = await projectRepository.update(project.id, {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.summary !== undefined && { summary: input.summary }),
    ...(input.overview !== undefined && { overview: input.overview }),
    ...(input.architecture !== undefined && { architecture: input.architecture }),
    ...(input.visibility !== undefined && {
      visibility: input.visibility as never,
    }),
    ...(input.featured !== undefined && { featured: input.featured }),
  });

  return toProjectDto(updated);
}

/**
 * Publish a project, making it publicly accessible.
 * Project must have enough information to be worth publishing.
 */
export async function publishProject(
  slug: string,
  userId: string
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  if (project.ownerId !== userId) {
    throw new AuthorizationError();
  }

  const updated = await projectRepository.update(project.id, {
    status: "PUBLISHED",
    visibility: "PUBLIC",
  });

  return toProjectDto(updated);
}

/**
 * Unpublish a project.
 */
export async function unpublishProject(
  slug: string,
  userId: string
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  const updated = await projectRepository.update(project.id, {
    status: "DRAFT",
    visibility: "PRIVATE",
  });

  return toProjectDto(updated);
}

/**
 * Delete a project. Only the owner may delete.
 * Does NOT delete the external GitHub repository or Vercel project.
 */
export async function deleteProject(
  slug: string,
  userId: string
): Promise<void> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  await projectRepository.delete(project.id);
}

/**
 * Update project features.
 */
export async function updateProjectFeatures(
  slug: string,
  userId: string,
  features: Array<{ title: string; description?: string | null; order?: number }>
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) throw new NotFoundError("Project");

  await projectRepository.replaceFeatures(project.id, features);
  const updated = await projectRepository.findById(project.id);
  return toProjectDto(updated!);
}

/**
 * Update project links.
 */
export async function updateProjectLinks(
  slug: string,
  userId: string,
  links: Array<{ label: string; url: string; type?: string }>
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) throw new NotFoundError("Project");

  await projectRepository.replaceLinks(project.id, links);
  const updated = await projectRepository.findById(project.id);
  return toProjectDto(updated!);
}

/**
 * Update project tech stack.
 */
export async function updateProjectTechStack(
  slug: string,
  userId: string,
  technologies: string[]
): Promise<ProjectDto> {
  const project = await projectRepository.findBySlugAndOwner(slug, userId);
  if (!project) throw new NotFoundError("Project");

  await projectRepository.replaceTechStack(project.id, technologies, "USER");
  const updated = await projectRepository.findById(project.id);
  return toProjectDto(updated!);
}

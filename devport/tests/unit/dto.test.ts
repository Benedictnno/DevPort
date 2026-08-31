import { describe, it, expect } from "vitest";
import {
  toProjectDto,
  toPublicProjectDto,
  toProjectSummaryDto,
} from "@/modules/projects/project.dto";
import type { ProjectWithRelations, ProjectSummary } from "@/modules/projects/project.repository";

describe("Project DTO Mappers", () => {
  const mockDate = new Date("2026-08-31T09:00:00.000Z");

  const mockProject: ProjectWithRelations = {
    id: "proj_123",
    slug: "my-app",
    title: "My App",
    summary: "A modern app",
    overview: "Comprehensive description",
    architecture: "Modular monolith",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    featured: true,
    syncStatus: "IDLE",
    lastSyncedAt: mockDate,
    ownerId: "user_123",
    createdAt: mockDate,
    updatedAt: mockDate,
    features: [
      {
        id: "feat_1",
        projectId: "proj_123",
        title: "Real-time sync",
        description: "Syncs via BullMQ",
        order: 0,
        createdAt: mockDate,
      },
    ],
    techStacks: [
      {
        projectId: "proj_123",
        techStackId: "tech_1",
        source: "USER",
        order: 0,
        techStack: {
          id: "tech_1",
          name: "Next.js",
          iconUrl: null,
        },
      },
    ],
    links: [
      {
        id: "link_1",
        projectId: "proj_123",
        label: "Live Demo",
        url: "https://demo.devport.app",
        type: "LIVE",
      },
    ],
    media: [],
    sources: [],
    repository: {
      id: "repo_1",
      integrationId: "int_1",
      projectId: "proj_123",
      githubId: 98765,
      fullName: "devport/my-app",
      name: "my-app",
      owner: "devport",
      description: "My App repo",
      defaultBranch: "main",
      language: "TypeScript",
      topics: ["nextjs"],
      isPrivate: false,
      url: "https://github.com/devport/my-app",
      cloneUrl: "https://github.com/devport/my-app.git",
      importStatus: "COMPLETE",
      analyzedAt: mockDate,
      lastPushedAt: mockDate,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    deployment: null,
    apiDocs: null,
  };

  it("should map Prisma entity to full ProjectDto", () => {
    const dto = toProjectDto(mockProject);

    expect(dto.id).toBe("proj_123");
    expect(dto.slug).toBe("my-app");
    expect(dto.title).toBe("My App");
    expect(dto.technologies).toEqual([
      { id: "tech_1", name: "Next.js", iconUrl: null },
    ]);
    expect(dto.features[0]?.title).toBe("Real-time sync");
    expect(dto.repository?.fullName).toBe("devport/my-app");
  });

  it("should omit private and internal fields in PublicProjectDto", () => {
    const publicDto = toPublicProjectDto(mockProject);

    // Should NOT have id, visibility, syncStatus, lastSyncedAt
    expect((publicDto as any).id).toBeUndefined();
    expect((publicDto as any).visibility).toBeUndefined();
    expect((publicDto as any).syncStatus).toBeUndefined();
    expect((publicDto as any).lastSyncedAt).toBeUndefined();

    // Should have public fields
    expect(publicDto.slug).toBe("my-app");
    expect(publicDto.title).toBe("My App");
    expect(publicDto.features.length).toBe(1);
  });
});

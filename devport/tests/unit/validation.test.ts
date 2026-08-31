import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  importRepositorySchema,
  createApiKeySchema,
  validate,
} from "@/shared/validation/schemas";
import { ValidationError } from "@/shared/errors";

describe("Validation Schemas", () => {
  describe("createProjectSchema", () => {
    it("should accept valid project creation input", () => {
      const input = {
        title: "DevPort Platform",
        slug: "devport-platform",
        summary: "Developer project intelligence platform",
        overview: "A long description here...",
        visibility: "PUBLIC" as const,
      };

      const result = validate(createProjectSchema, input);
      expect(result.slug).toBe("devport-platform");
      expect(result.visibility).toBe("PUBLIC");
    });

    it("should reject uppercase or invalid characters in slug", () => {
      const input = {
        title: "DevPort",
        slug: "DevPort_App!",
        summary: "A project summary",
      };

      expect(() => validate(createProjectSchema, input)).toThrow(ValidationError);
    });

    it("should reject missing required title or summary", () => {
      expect(() =>
        validate(createProjectSchema, {
          title: "",
          slug: "valid-slug",
          summary: "",
        })
      ).toThrow(ValidationError);
    });
  });

  describe("importRepositorySchema", () => {
    it("should validate a repository import payload", () => {
      const input = {
        githubId: 123456,
        fullName: "user/repo",
        name: "repo",
        owner: "user",
        url: "https://github.com/user/repo",
        cloneUrl: "https://github.com/user/repo.git",
        defaultBranch: "main",
        topics: ["nextjs", "typescript"],
        isPrivate: false,
      };

      const result = validate(importRepositorySchema, input);
      expect(result.githubId).toBe(123456);
      expect(result.topics).toEqual(["nextjs", "typescript"]);
    });

    it("should reject non-positive github IDs", () => {
      expect(() =>
        validate(importRepositorySchema, {
          githubId: -1,
          fullName: "user/repo",
          name: "repo",
          owner: "user",
          url: "https://github.com/user/repo",
          cloneUrl: "https://github.com/user/repo.git",
        })
      ).toThrow(ValidationError);
    });
  });

  describe("createApiKeySchema", () => {
    it("should accept valid API key input with default scopes", () => {
      const result = validate(createApiKeySchema, { name: "Portfolio App" });
      expect(result.name).toBe("Portfolio App");
      expect(result.scopes).toEqual(["projects:read"]);
    });
  });
});

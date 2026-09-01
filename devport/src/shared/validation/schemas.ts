import { z } from "zod";
export { validate } from "./validate";

// ─── Reserved Slugs ────────────────────────────────────────────────────────
// These conflict with Next.js app routes and must not be used as project slugs
const RESERVED_SLUGS = new Set([
  "api", "auth", "dashboard", "public", "admin", "settings",
  "login", "signup", "register", "logout", "profile", "account",
  "projects", "integrations", "keys", "docs", "help", "support",
  "about", "contact", "privacy", "terms", "404", "500",
]);

// ─── Project Schemas ───────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .superRefine((slug, ctx) => {
      if (RESERVED_SLUGS.has(slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${slug}" is a reserved slug and cannot be used`,
        });
      }
    }),
  summary: z.string().min(1, "Summary is required").max(300),
  overview: z.string().max(10000).optional().default(""),
  architecture: z.string().max(10000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PRIVATE"),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  summary: z.string().min(1).max(300).optional(),
  overview: z.string().max(10000).optional(),
  architecture: z.string().max(10000).optional(),
  productionUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  featured: z.boolean().optional(),
});

export const projectFeatureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

export const projectLinkSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().url("Must be a valid URL"),
  type: z
    .enum(["GITHUB", "LIVE", "API", "DOCS", "DEMO", "SOCIAL", "EXTERNAL"])
    .optional()
    .default("EXTERNAL"),
});

export const upsertFeaturesSchema = z.object({
  features: z.array(projectFeatureSchema).max(20),
});

export const upsertLinksSchema = z.object({
  links: z.array(projectLinkSchema).max(20),
});

export const upsertTechStackSchema = z.object({
  technologies: z.array(z.string().min(1).max(60)).max(50),
});

// ─── API Key Schemas ───────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z
    .array(z.enum(["projects:read", "projects:write"]))
    .min(1)
    .optional()
    .default(["projects:read"]),
  expiresAt: z
    .string()
    .datetime()
    .refine(
      (val) => new Date(val) > new Date(),
      { message: "Expiry date must be in the future" }
    )
    .optional(),
});

// ─── GitHub Integration Schemas ────────────────────────────────────────────

export const importRepositorySchema = z.object({
  githubId: z.number().int().positive(),
  fullName: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  description: z.string().optional().nullable(),
  defaultBranch: z.string().optional().default("main"),
  language: z.string().optional().nullable(),
  topics: z.array(z.string()).optional().default([]),
  isPrivate: z.boolean().optional().default(false),
  url: z.string().url(),
  cloneUrl: z.string().url(),
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ImportRepositoryInput = z.infer<typeof importRepositorySchema>;

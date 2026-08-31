import { describe, it, expect } from "vitest";
import {
  analyzeFileList,
  extractTechnologiesFromPackageJson,
} from "@/jobs/repository-analysis/analyzer";

describe("Repository Analyzer", () => {
  it("should detect technologies and openapi candidates from file paths", () => {
    const files = [
      "src/index.ts",
      "src/App.tsx",
      "next.config.js",
      "schema.prisma",
      "docker-compose.yml",
      "docs/openapi.yaml",
      "package.json",
      ".env", // should be excluded
      "credentials.json", // should be excluded
    ];

    const result = analyzeFileList(files);

    expect(result.estimatedTechnologies).toContain("TypeScript");
    expect(result.estimatedTechnologies).toContain("Next.js");
    expect(result.estimatedTechnologies).toContain("Prisma");
    expect(result.estimatedTechnologies).toContain("Docker");
    expect(result.detectedOpenApiFiles).toEqual(["docs/openapi.yaml"]);
    expect(result.detectedManifestFiles).toEqual(["package.json"]);
  });

  it("should extract frameworks and libraries from package.json", () => {
    const pkg = JSON.stringify({
      dependencies: {
        next: "14.2.0",
        react: "18.2.0",
        "@prisma/client": "5.10.0",
        bullmq: "5.0.0",
        tailwindcss: "3.4.0",
      },
      devDependencies: {
        vitest: "1.0.0",
        typescript: "5.3.0",
      },
    });

    const techs = extractTechnologiesFromPackageJson(pkg);

    expect(techs).toContain("Next.js");
    expect(techs).toContain("React");
    expect(techs).toContain("Prisma");
    expect(techs).toContain("BullMQ");
    expect(techs).toContain("Tailwind CSS");
    expect(techs).toContain("Vitest");
  });

  it("should safely handle malformed package.json content without throwing", () => {
    const techs = extractTechnologiesFromPackageJson("{ invalid json }");
    expect(techs).toEqual([]);
  });
});

import YAML from "yaml";
import type { HttpMethod } from "@prisma/client";

export interface ParsedEndpoint {
  method: HttpMethod;
  path: string;
  summary?: string | null;
  description?: string | null;
  tags: string[];
  deprecated?: boolean;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Record<string, unknown>;
  }>;
  requestSchema?: Record<string, unknown> | null;
  responseSchema?: Record<string, unknown> | null;
  order: number;
}

export interface ParsedApiDocumentation {
  title: string;
  version?: string | null;
  description?: string | null;
  baseUrl?: string | null;
  specVersion?: string | null;
  rawSpec: Record<string, unknown>;
  endpoints: ParsedEndpoint[];
}

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

/**
 * Parse an OpenAPI 3.x or Swagger 2.0 specification (JSON or YAML format).
 */
export function parseOpenApiSpec(content: string): ParsedApiDocumentation | null {
  if (!content || !content.trim()) return null;

  let spec: Record<string, any>;
  try {
    // Try parsing as JSON first, fallback to YAML
    if (content.trim().startsWith("{")) {
      spec = JSON.parse(content);
    } else {
      spec = YAML.parse(content);
    }
  } catch {
    try {
      spec = YAML.parse(content);
    } catch {
      return null;
    }
  }

  if (!spec || typeof spec !== "object") return null;

  // Check if it looks like an OpenAPI or Swagger doc
  const specVersion = spec.openapi ?? spec.swagger ?? null;
  if (!spec.paths && !specVersion) {
    return null;
  }

  const info = spec.info ?? {};
  const title = String(info.title ?? "API Documentation");
  const version = info.version ? String(info.version) : null;
  const description = info.description ? String(info.description) : null;

  // Determine base URL
  let baseUrl: string | null = null;
  if (Array.isArray(spec.servers) && spec.servers.length > 0 && spec.servers[0]?.url) {
    baseUrl = String(spec.servers[0].url);
  } else if (spec.host) {
    const scheme = Array.isArray(spec.schemes) && spec.schemes[0] ? spec.schemes[0] : "https";
    const basePath = spec.basePath ?? "";
    baseUrl = `${scheme}://${spec.host}${basePath}`;
  }

  const endpoints: ParsedEndpoint[] = [];
  const paths = spec.paths ?? {};
  let orderIndex = 0;

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [methodKey, operation] of Object.entries(pathItem)) {
      const upperMethod = methodKey.toUpperCase();
      if (!VALID_METHODS.has(upperMethod) || !operation || typeof operation !== "object") {
        continue;
      }

      const op = operation as Record<string, any>;
      const tags = Array.isArray(op.tags) ? op.tags.map(String) : [];

      // Parameters
      const rawParams = Array.isArray(op.parameters) ? op.parameters : [];
      const parameters = rawParams.map((p: any) => ({
        name: String(p.name ?? ""),
        in: String(p.in ?? "query"),
        required: Boolean(p.required),
        description: p.description ? String(p.description) : undefined,
        schema: p.schema ?? (p.type ? { type: p.type } : undefined),
      }));

      // Request Schema (OpenAPI 3.x requestBody or Swagger 2.0 body param)
      let requestSchema: Record<string, unknown> | null = null;
      if (op.requestBody?.content?.["application/json"]?.schema) {
        requestSchema = op.requestBody.content["application/json"].schema;
      } else {
        const bodyParam = rawParams.find((p: any) => p.in === "body");
        if (bodyParam?.schema) {
          requestSchema = bodyParam.schema;
        }
      }

      // Response Schema (200 / 201)
      let responseSchema: Record<string, unknown> | null = null;
      const successRes = op.responses?.["200"] ?? op.responses?.["201"] ?? op.responses?.["204"];
      if (successRes?.content?.["application/json"]?.schema) {
        responseSchema = successRes.content["application/json"].schema;
      } else if (successRes?.schema) {
        responseSchema = successRes.schema;
      }

      endpoints.push({
        method: upperMethod as HttpMethod,
        path: pathKey,
        summary: op.summary ? String(op.summary) : null,
        description: op.description ? String(op.description) : null,
        tags,
        deprecated: Boolean(op.deprecated),
        parameters: parameters.length > 0 ? parameters : undefined,
        requestSchema,
        responseSchema,
        order: orderIndex++,
      });
    }
  }

  return {
    title,
    version,
    description,
    baseUrl,
    specVersion: specVersion ? String(specVersion) : null,
    rawSpec: spec,
    endpoints,
  };
}

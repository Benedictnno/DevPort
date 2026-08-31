import Groq from "groq-sdk";
import { z } from "zod";
import type {
  AIProvider,
  ProjectExtractionInput,
  ExtractedProjectInformation,
} from "./ai.provider";
import { IntegrationError } from "@/shared/errors";
import { logger } from "@/shared/logger";

// Schema to validate and parse AI output
const extractedProjectSchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(300),
  overview: z.string().max(5000),
  features: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000),
      })
    )
    .max(15)
    .default([]),
  technologies: z.array(z.string().min(1).max(60)).max(50).default([]),
  architecture: z.string().max(3000).nullable().default(null),
});

export class GroqAdapter implements AIProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor(
    apiKey = process.env.GROQ_API_KEY ?? "",
    model = "llama-3.3-70b-versatile"
  ) {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  async extractProjectInformation(
    input: ProjectExtractionInput
  ): Promise<ExtractedProjectInformation> {
    const prompt = buildExtractionPrompt(input);

    logger.info("Calling Groq AI for project extraction", {
      repository: input.repositoryName,
      model: this.model,
    });

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new IntegrationError("Empty response from AI provider", "groq");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        throw new IntegrationError(
          "AI response was not valid JSON",
          "groq"
        );
      }

      // Validate AI output with Zod before trusting it
      const result = extractedProjectSchema.safeParse(parsed);
      if (!result.success) {
        logger.warn("AI output failed schema validation", {
          errors: result.error.flatten(),
        });
        throw new IntegrationError(
          "AI response did not match expected schema",
          "groq"
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(
        `Groq AI extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        "groq"
      );
    }
  }
}

// ─── Prompt Construction ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a technical writer analyzing software projects.
Your job is to extract structured information from project metadata and README files.
Always respond with valid JSON matching the requested schema.
Be accurate, concise, and developer-focused.
Do not invent capabilities that aren't supported by the provided content.
Do not include sensitive information (keys, passwords, secrets).`;

function buildExtractionPrompt(input: ProjectExtractionInput): string {
  const sections: string[] = [];

  sections.push(`## Repository Information
Name: ${input.repositoryName}
Description: ${input.repositoryDescription ?? "None provided"}
Primary Language: ${input.language ?? "Unknown"}
Topics: ${input.topics.length > 0 ? input.topics.join(", ") : "None"}
Detected Files: ${input.detectedFiles.slice(0, 30).join(", ")}`);

  if (input.readmeContent) {
    // Limit README to 8000 chars to stay within context limits
    const truncated = input.readmeContent.substring(0, 8000);
    sections.push(`## README Content\n${truncated}`);
  }

  if (input.packageJsonContent) {
    const truncated = input.packageJsonContent.substring(0, 2000);
    sections.push(`## package.json\n${truncated}`);
  }

  sections.push(`## Required Output Format (JSON)
Return a JSON object with these fields:
{
  "title": "Human-friendly project title (not necessarily the repo name)",
  "summary": "One sentence description, max 300 chars",
  "overview": "2-4 paragraph description of what this project does, why it exists, and how it works",
  "features": [{"title": "Feature name", "description": "Brief description"}],
  "technologies": ["Technology1", "Technology2"],
  "architecture": "Optional paragraph describing the technical architecture"
}`);

  return sections.join("\n\n");
}

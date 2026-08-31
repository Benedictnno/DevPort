// AIProvider interface
// All AI implementations must satisfy this contract.
// The application never imports Groq/OpenAI/etc. directly — only this interface.

export interface ProjectExtractionInput {
  repositoryName: string;
  repositoryDescription: string | null;
  language: string | null;
  topics: string[];
  readmeContent: string | null;
  packageJsonContent: string | null;
  detectedFiles: string[];
}

export interface ExtractedProjectInformation {
  title: string;
  summary: string;
  overview: string;
  features: Array<{ title: string; description: string }>;
  technologies: string[];
  architecture: string | null;
}

export interface AIProvider {
  extractProjectInformation(
    input: ProjectExtractionInput
  ): Promise<ExtractedProjectInformation>;
}

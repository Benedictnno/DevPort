import { z, ZodSchema } from "zod";
import { ValidationError } from "@/shared/errors";

/**
 * Parse and validate request input against a Zod schema.
 * Throws a typed ValidationError on failure.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten();
    throw new ValidationError("Validation failed", details);
  }
  return result.data;
}

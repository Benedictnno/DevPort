import { db } from "@/lib/db";
import { generateApiKey } from "@/shared/crypto";
import { NotFoundError, AuthorizationError } from "@/shared/errors";
import type { CreateApiKeyInput } from "@/shared/validation/schemas";

export interface ApiKeyDto {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedApiKeyDto extends ApiKeyDto {
  // Full key — shown once only
  key: string;
}

/**
 * Create a new API key for a user.
 * Returns the full key only on creation — never again.
 */
export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput
): Promise<CreatedApiKeyDto> {
  const { key, hash, prefix } = generateApiKey();

  const record = await db.apiKey.create({
    data: {
      userId,
      name: input.name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: input.scopes ?? ["projects:read"],
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });

  return {
    id: record.id,
    key, // plaintext — shown once only
    name: record.name,
    prefix: record.keyPrefix,
    scopes: record.scopes,
    lastUsedAt: null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * List all API keys for a user (without the full key).
 */
export async function listApiKeys(userId: string): Promise<ApiKeyDto[]> {
  const keys = await db.apiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.keyPrefix,
    scopes: k.scopes,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    expiresAt: k.expiresAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }));
}

/**
 * Revoke an API key. Only the owner can revoke.
 */
export async function revokeApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  const key = await db.apiKey.findUnique({ where: { id: keyId } });
  if (!key) throw new NotFoundError("API key");
  if (key.userId !== userId) throw new AuthorizationError();

  await db.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}

import crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// ─── API Key Utilities ─────────────────────────────────────────────────────

/**
 * Generate a new API key.
 * Returns the full plaintext key (shown once to user) and its hash (stored in DB).
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const key = `dp_live_${randomBytes}`;
  const prefix = key.substring(0, 15); // "dp_live_" + 7 chars
  const hash = hashApiKey(key);
  return { key, hash, prefix };
}

/**
 * Hash an API key for storage. Uses SHA-256 for speed on lookup,
 * since API key validation happens on every authenticated request.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// ─── Password Utilities ────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Webhook Signature Utilities ───────────────────────────────────────────

/**
 * Verify a GitHub webhook signature.
 * GitHub sends X-Hub-Signature-256: sha256=<hex>
 */
export function verifyGitHubWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// ─── Token Utilities ───────────────────────────────────────────────────────

/**
 * Encrypt a value (e.g. OAuth access token) for storage.
 * Uses AES-256-GCM.
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

export function encryptToken(plaintext: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(ciphertext: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

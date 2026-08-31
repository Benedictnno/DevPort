import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyGitHubWebhookSignature } from "@/shared/crypto";

describe("Crypto Utilities", () => {
  it("should generate a valid API key with prefix and hash", () => {
    const { key, hash, prefix } = generateApiKey();

    expect(key).toMatch(/^dp_live_[a-f0-9]{64}$/);
    expect(prefix).toBe(key.substring(0, 15));
    expect(hash).toBe(hashApiKey(key));
  });

  it("should generate unique API keys on subsequent calls", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1.key).not.toBe(key2.key);
    expect(key1.hash).not.toBe(key2.hash);
  });

  it("should correctly verify a valid GitHub webhook signature", () => {
    const payload = JSON.stringify({ action: "push", repository: { name: "devport" } });
    const secret = "test-secret-123";

    const crypto = require("crypto");
    const validSignature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

    expect(verifyGitHubWebhookSignature(payload, validSignature, secret)).toBe(true);
  });

  it("should reject an invalid GitHub webhook signature", () => {
    const payload = JSON.stringify({ action: "push" });
    const secret = "test-secret-123";
    const invalidSignature = "sha256=0000000000000000000000000000000000000000000000000000000000000000";

    expect(verifyGitHubWebhookSignature(payload, invalidSignature, secret)).toBe(false);
  });
});

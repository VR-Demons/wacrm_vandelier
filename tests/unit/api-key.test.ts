import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, validateApiKey } from "../../src/lib/auth/api-key";

describe("API Key Utilities", () => {
  it("generateApiKey produces a key, hash, and prefix", async () => {
    const result = await generateApiKey();
    expect(result.key).toMatch(/^sk_live_[a-zA-Z0-9]+$/);
    expect(result.prefix).toBe(result.key.substring(0, 12));
    expect(result.hash).toBeDefined();
    expect(result.hash.length).toBeGreaterThan(0);
  });

  it("hashApiKey hashes a key consistently", async () => {
    const key = "sk_live_1234567890abcdef";
    const hash1 = await hashApiKey(key);
    const hash2 = await hashApiKey(key);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(key);
  });

  it("validateApiKey returns true for matching key and hash", async () => {
    const key = "sk_live_test123";
    const hash = await hashApiKey(key);
    expect(await validateApiKey(key, hash)).toBe(true);
  });

  it("validateApiKey returns false for wrong key", async () => {
    const key = "sk_live_test123";
    const wrongKey = "sk_live_wrong";
    const hash = await hashApiKey(key);
    expect(await validateApiKey(wrongKey, hash)).toBe(false);
  });
});

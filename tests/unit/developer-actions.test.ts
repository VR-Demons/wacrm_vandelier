import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateNewApiKey, revokeApiKey, updateOutboxDelayLimit } from "../../src/app/(app)/settings/developer/actions";

// Mock the db and auth
vi.mock("../../src/lib/db", () => {
  const mockDb = {
    transaction: vi.fn(async (cb) => {
      return cb({
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        eq: vi.fn(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn(),
      });
    }),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    eq: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return {
    getDb: vi.fn(() => mockDb)
  };
});

// We should mock betterAuth if needed, but actions can just accept orgId for simplicity 
// in this module, or if they read from cookies, we mock the auth module.
// Let's assume actions take organizationId as argument for now, or we mock auth.

describe("Developer Settings Actions", () => {
  it("generateNewApiKey returns a plain text key", async () => {
    const result = await generateNewApiKey("org_1");
    expect(result.key).toMatch(/^sk_live_/);
    expect(result.error).toBeUndefined();
  });

  it("revokeApiKey completes without error", async () => {
    const result = await revokeApiKey("org_1");
    expect(result.success).toBe(true);
  });

  it("updateOutboxDelayLimit updates the limit", async () => {
    const result = await updateOutboxDelayLimit("org_1", 500);
    expect(result.success).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateRequestApiKey } from "../../src/lib/auth/public-api";
import { hashApiKey } from "../../src/lib/auth/api-key";

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    query: {
      apiKey: {
        findFirst: vi.fn(),
      }
    }
  };
  return { getDb: () => mockDb };
});

import { getDb } from "../../src/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = getDb() as any;

describe("validateRequestApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if header is missing", async () => {
    const req = new Request("http://localhost/api/test");
    const result = await validateRequestApiKey(req);
    expect(result).toBeNull();
  });

  it("returns null if key not found in db", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "sk_live_missing" }
    });
    vi.mocked(db.query.apiKey.findFirst).mockResolvedValue(null);
    const result = await validateRequestApiKey(req);
    expect(result).toBeNull();
  });

  it("returns null if hash mismatch", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "sk_live_mismatch" }
    });
    vi.mocked(db.query.apiKey.findFirst).mockResolvedValue({
      id: "key_1",
      organizationId: "org_1",
      keyHash: "different_hash",
    });
    const result = await validateRequestApiKey(req);
    expect(result).toBeNull();
  });

  it("returns organizationId if valid", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "sk_live_valid" }
    });
    const expectedHash = await hashApiKey("sk_live_valid");
    vi.mocked(db.query.apiKey.findFirst).mockResolvedValue({
      id: "key_1",
      organizationId: "org_1",
      keyHash: expectedHash,
    });
    const result = await validateRequestApiKey(req);
    expect(result).toEqual({ organizationId: "org_1" });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/public/v1/contacts/route";
import * as auth from "../../src/lib/auth/public-api";

vi.mock("../../src/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
}));

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    transaction: vi.fn(async (cb) => {
      return cb({
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: "contact_1" }]),
      });
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "contact_1" }]),
  };
  return {
    getDb: vi.fn(() => mockDb)
  };
});

describe("POST /api/public/v1/contacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue(null);
    const req = new Request("http://localhost/api/public/v1/contacts", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("processes a single contact", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/contacts", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", phone: "5215555555555" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.total).toBe(1);
    expect(data.summary.success).toBe(1);
  });

  it("processes a batch of contacts", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/contacts", {
      method: "POST",
      body: JSON.stringify([
        { name: "Alice", phone: "5215555555555" },
        { name: "Bob", phone: "5215555555556" },
      ]),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(2);
  });
});

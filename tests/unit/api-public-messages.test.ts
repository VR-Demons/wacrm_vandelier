import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/public/v1/messages/route";
import * as auth from "../../src/lib/auth/public-api";

vi.mock("../../src/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
}));

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  };
  return { getDb: () => mockDb };
});

import { getDb } from "../../src/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = getDb() as any;

describe("POST /api/public/v1/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue(null);
    const req = new Request("http://localhost/api/public/v1/messages", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("inserts single message into outbox", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify({ contactId: "c_1", message: "Hello!" }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("inserts batch messages into outbox", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify([
        { contactId: "c_1", message: "Hello 1" },
        { contactId: "c_2", message: "Hello 2" }
      ]),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.total).toBe(2);
    expect(db.insert).toHaveBeenCalledTimes(2);
  });
});

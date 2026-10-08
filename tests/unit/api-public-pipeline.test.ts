import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "../../src/app/api/public/v1/pipeline/route";
import * as auth from "../../src/lib/auth/public-api";

vi.mock("../../src/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
}));

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    query: {
      lead: { findFirst: vi.fn() },
      pipelineStage: { findFirst: vi.fn() },
    },
    transaction: vi.fn(async (cb) => {
      return cb({
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
      });
    }),
  };
  return { getDb: () => mockDb };
});

import { getDb } from "../../src/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = getDb() as any;

describe("PUT /api/public/v1/pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue(null);
    const req = new Request("http://localhost/api/public/v1/pipeline", { method: "PUT" });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 if lead not found", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    vi.mocked(db.query.lead.findFirst).mockResolvedValue(null);
    
    const req = new Request("http://localhost/api/public/v1/pipeline", {
      method: "PUT",
      body: JSON.stringify({ contactId: "c_1", state: "won" }),
    });
    
    const res = await PUT(req);
    expect(res.status).toBe(404);
  });

  it("processes pipeline state update to lost with default reason", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    vi.mocked(db.query.lead.findFirst).mockResolvedValue({ id: "lead_1", contactId: "c_1", stageId: "s_1" });
    vi.mocked(db.query.pipelineStage.findFirst).mockResolvedValue({ id: "stage_lost", name: "Perdido", kind: "lost" });
    
    const req = new Request("http://localhost/api/public/v1/pipeline", {
      method: "PUT",
      body: JSON.stringify({ contactId: "c_1", state: "lost" }),
    });
    
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

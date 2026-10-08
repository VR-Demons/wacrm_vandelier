import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/public/v1/folios/route";
import * as auth from "../../src/lib/auth/public-api";
import * as foliosModule from "../../src/server/folios";

vi.mock("../../src/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
  requirePublicApiKey: vi.fn(),
}));

vi.mock("../../src/server/folios", () => ({
  upsertContactFolios: vi.fn(),
}));

describe("POST /api/public/v1/folios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    // Mock requirePublicApiKey to return an error response
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({ 
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    });
    
    const req = new Request("http://localhost/api/public/v1/folios", { method: "POST" });
    const res = await POST(req) as Response;
    expect(res.status).toBe(401);
  });

  it("returns 400 if invalid JSON", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({ organizationId: "org_1" });
    
    const req = new Request("http://localhost/api/public/v1/folios", { 
      method: "POST",
      body: "{" // invalid json
    });
    
    const res = await POST(req) as Response;
    expect(res.status).toBe(400);
  });

  it("processes a single folio", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({ organizationId: "org_1" });
    vi.mocked(foliosModule.upsertContactFolios).mockResolvedValue([{ id: "folio_1" }] as any);

    const req = new Request("http://localhost/api/public/v1/folios", {
      method: "POST",
      body: JSON.stringify({ Folio: 1234, Telefono: "5215555555555" }),
    });
    const res = await POST(req) as Response;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.total).toBe(1);
    expect(data.summary.success).toBe(1);

    expect(foliosModule.upsertContactFolios).toHaveBeenCalledWith("org_1", [{ Folio: 1234, Telefono: "5215555555555" }]);
  });

  it("processes a batch of folios", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({ organizationId: "org_1" });
    vi.mocked(foliosModule.upsertContactFolios).mockResolvedValue([
      { id: "folio_1" },
      { id: "folio_2" }
    ] as any);

    const req = new Request("http://localhost/api/public/v1/folios", {
      method: "POST",
      body: JSON.stringify([
        { Folio: 1234, Telefono: "5215555555555" },
        { Folio: 1235, Telefono: "5215555555556" },
      ]),
    });
    const res = await POST(req) as Response;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(2);

    expect(foliosModule.upsertContactFolios).toHaveBeenCalledWith("org_1", [
      { Folio: 1234, Telefono: "5215555555555" },
      { Folio: 1235, Telefono: "5215555555556" },
    ]);
  });

  it("handles errors gracefully", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({ organizationId: "org_1" });
    vi.mocked(foliosModule.upsertContactFolios).mockRejectedValue(new Error("Database error"));

    const req = new Request("http://localhost/api/public/v1/folios", {
      method: "POST",
      body: JSON.stringify({ Folio: 1234 }),
    });
    
    const res = await POST(req) as Response;
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal Server Error");
  });
});

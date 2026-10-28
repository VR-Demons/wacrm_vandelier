/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../src/app/api/public/v1/templates/route";
import * as auth from "../../src/lib/auth/public-api";
import { NextResponse } from "next/server";

vi.mock("../../src/lib/auth/public-api", () => ({
  requirePublicApiKey: vi.fn(),
}));

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "tpl_1",
              organizationId: "org_1",
              name: "aviso_pago",
              language: "es_MX",
              category: "UTILITY",
              status: "approved",
              body: "Hola {{1}}, tu pago de {{2}} vence el {{3}}.",
              header: null,
              footer: "Gracias por su preferencia",
              buttons: null,
              variablesMap: {
                body_1: "Nombre del Cliente",
                body_2: "Monto",
                body_3: "Fecha de Vencimiento",
              },
            },
          ]),
        })),
      })),
    })),
  };
  return { getDb: () => mockDb, schema: { template: {} } };
});

describe("GET /api/public/v1/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new Request("http://localhost/api/public/v1/templates", { method: "GET" });
    const res = await GET(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(401);
  });

  it("returns templates list with required variables and example payload", async () => {
    vi.mocked(auth.requirePublicApiKey).mockResolvedValue({
      organizationId: "org_1",
    });

    const req = new Request("http://localhost/api/public/v1/templates", { method: "GET" });
    const res = await GET(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(200);

    const data = await res!.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.templates[0].name).toBe("aviso_pago");
    expect(data.templates[0].requiredVariables).toEqual(["1", "2", "3"]);
    expect(data.templates[0].examplePayload).toEqual({
      phone: "+5215512345678",
      template: "aviso_pago",
      language: "es_MX",
      variables: {
        "1": "[Nombre del Cliente]",
        "2": "[Monto]",
        "3": "[Fecha de Vencimiento]",
      },
      immediate: true,
    });
  });
});

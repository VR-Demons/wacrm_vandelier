/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/public/v1/schedule/route";
import * as scheduleService from "@/server/collections/scheduleService";
import * as publicAuth from "@/lib/auth/public-api";
import * as sessionAuth from "@/lib/auth/session";

vi.mock("@/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
  requirePublicApiKey: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionOrNull: vi.fn(),
}));

describe("API /api/public/v1/schedule", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(publicAuth.validateRequestApiKey).mockResolvedValue(null);
    vi.mocked(sessionAuth.getSessionOrNull).mockResolvedValue(null as any);
  });

  it("handles GET request and returns simulation result", async () => {
    const mockSimulationResult = {
      summary: {
        referenceDateIso: "2026-10-31T15:00:00.000Z",
        referenceDateLocal: "31/10/2026, 9:00:00",
        configuredDay: "2026-10-31T09:00:00",
        configuredTimeZone: "America/Mexico_City",
        configuredFlows: ["ALL"],
        totalExigibilidadInBase: 1,
        totalAtrasadosInBase: 0,
        totalWhatsAppMessages: 1,
        totalEmails: 0,
        totalAmountWhatsApp: 50000,
        totalAmountEmails: 0,
        filteredWhatsAppMessages: 1,
        filteredEmails: 0,
        filteredAmountWhatsApp: 50000,
        filteredAmountEmails: 0,
        countsByFlow: { earlyBird: 1, payDay: 0, dueWhatsApp: 0, dueEmail: 0 },
        countsByProduct: { arrendamiento: 1, prestamo: 0 },
        foliosByFlow: { earlyBird: 1, payDay: 0, dueWhatsApp: 0, dueEmail: 0 },
      },
      whatsAppMessages: [],
      emails: [],
      sourceUsed: "n8n" as const,
    };

    const spy = vi.spyOn(scheduleService, "getCollectionsScheduleSimulation").mockResolvedValue(mockSimulationResult);

    const req = new Request("http://localhost/api/public/v1/schedule?date=2026-10-31T09:00:00-06:00&flow=EarlyBird&timezone=mexico", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceDate: "2026-10-31T09:00:00-06:00",
        flow: "EarlyBird",
        timeZone: "mexico",
      })
    );

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.totalWhatsAppMessages).toBe(1);
    expect(data.sourceUsed).toBe("n8n");
  });

  it("returns 401 if x-api-key is invalid", async () => {
    vi.mocked(publicAuth.validateRequestApiKey).mockResolvedValue(null);

    const req = new Request("http://localhost/api/public/v1/schedule", {
      method: "GET",
      headers: { "x-api-key": "invalid_key" },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("handles POST request with custom client data", async () => {
    const req = new Request("http://localhost/api/public/v1/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exigibilidadClients: [
          {
            Folio: 101,
            Cliente: "Empresa Test SA de CV",
            Contacto: "Juan",
            FechaExigibilidad: "2026-11-04T18:00:00.000Z",
            Producto: "ARRENDAMIENTO",
            Total: 25000,
            Pagado: false,
            Telefono: "5512345678",
            Personalidad: "MORAL",
          },
        ],
        config: {
          flow_earlybird: true,
          test_mode: false,
        },
        referenceDate: "2026-10-31T09:00:00-06:00",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.countsByFlow.earlyBird).toBe(1);
    expect(data.whatsAppMessages.length).toBe(1);
    expect(data.whatsAppMessages[0].template).toBe("recordatorio_pago_moral_1");
    expect(data.whatsAppMessages[0].phone).toBe("+525512345678");
  });

  it("returns 500 when simulation service throws an error", async () => {
    vi.spyOn(scheduleService, "getCollectionsScheduleSimulation").mockRejectedValue(
      new Error("n8n connection failed")
    );

    const req = new Request("http://localhost/api/public/v1/schedule", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("n8n connection failed");
  });
});

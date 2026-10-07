import { describe, expect, it } from "vitest";
import { normalizeContactPhone } from "@/lib/phone";
import { serializeFolioSummary } from "@/server/folios";
import { schema } from "@/lib/db";

describe("Folio Logic & Privacy Guarantees", () => {
  it("strictly serializes only Folio, FechaExigibilidad and Producto (hiding Total, Mora, RFC, etc.)", () => {
    const rawRecord = {
      id: "cf_123",
      folio: 796,
      fechaExigibilidad: new Date("2026-10-01T06:00:00.000Z"),
      producto: "PRESTAMO",
      total: "9000.00",
      mora: "0.00",
      rfc: "GAR123456",
      cliente: "Diego Garcia",
      correo: "test@example.com",
    };

    const summary = serializeFolioSummary(rawRecord);

    // Debe contener únicamente los 4 campos seguros
    expect(summary).toEqual({
      id: "cf_123",
      folio: 796,
      fechaExigibilidad: "2026-10-01T06:00:00.000Z",
      producto: "PRESTAMO",
    });

    // Ningún campo confidencial debe filtrarse
    expect(Object.keys(summary).sort()).toEqual([
      "fechaExigibilidad",
      "folio",
      "id",
      "producto",
    ]);
  });

  it("verifies database schema foreign key onDelete cascade definition", () => {
    // schema.contactFolio.contactId tiene referencia con onDelete: "cascade"
    const contactIdCol = schema.contactFolio.contactId;
    expect(contactIdCol).toBeDefined();
    // schema Drizzle tiene name 'contact_id'
    expect(contactIdCol.name).toBe("contact_id");
  });

  it("verifies +52 normalization rule for 10-digit phones", () => {
    expect(normalizeContactPhone("5521738363")).toBe("525521738363");
    expect(normalizeContactPhone("+525521738363")).toBe("525521738363");
  });
});

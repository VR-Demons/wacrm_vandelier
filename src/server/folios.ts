import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { scoped } from "@/lib/db/tenant";
import { normalizeContactPhone } from "@/lib/phone";
import type { ContactFolioSummaryDto } from "@/lib/types";

export type IngestFolioInput = {
  folio?: number;
  Folio?: number;
  cliente?: string | null;
  Cliente?: string | null;
  fechaExigibilidad?: string | Date | null;
  FechaExigibilidad?: string | Date | null;
  producto?: string | null;
  Producto?: string | null;
  total?: number | string | null;
  Total?: number | string | null;
  pagado?: boolean | null;
  Pagado?: boolean | null;
  mora?: number | string | null;
  Mora?: number | string | null;
  telefono?: string | number | null;
  Telefono?: string | number | null;
  phone?: string | number | null;
  correo?: string | null;
  Correo?: string | null;
  contacto?: string | null;
  Contacto?: string | null;
  rfc?: string | null;
  RFC?: string | null;
  personalidad?: string | null;
  Personalidad?: string | null;
  id?: number | string | null;
  externalId?: number | string | null;
  [key: string]: unknown;
};

/**
 * Serializa un folio exponiendo ESTRICTAMENTE solo los 3 campos permitidos en UI:
 * Folio, Fecha de Exigibilidad y Producto.
 */
export function serializeFolioSummary(f: {
  id: string;
  folio: number;
  fechaExigibilidad: Date | string | null;
  producto: string | null;
}): ContactFolioSummaryDto {
  return {
    id: f.id,
    folio: f.folio,
    fechaExigibilidad:
      f.fechaExigibilidad instanceof Date
        ? f.fechaExigibilidad.toISOString()
        : typeof f.fechaExigibilidad === "string"
        ? f.fechaExigibilidad
        : null,
    producto: f.producto ?? null,
  };
}

/**
 * Upsert masivo de registros de cartera por folio.
 * 1. Normaliza teléfono con regla +52.
 * 2. Asocia con contactos existentes en el tenant.
 * 3. Ejecuta upsert atómico onConflict sobre (organization_id, folio).
 */
export async function upsertContactFolios(
  organizationId: string,
  folios: IngestFolioInput[]
) {
  if (folios.length === 0) return [];
  const db = getDb();

  // 1. Extraer y estructurar datos de entrada
  const parsedItems = folios.map((input) => {
    const rawFolio = input.Folio ?? input.folio;
    const folioNum = Number(rawFolio);
    const rawPhone = String(
      input.Telefono ?? input.telefono ?? input.phone ?? ""
    ).trim();
    const phone = normalizeContactPhone(rawPhone);

    let fechaExig: Date | null = null;
    const rawFecha = input.FechaExigibilidad ?? input.fechaExigibilidad;
    if (rawFecha) {
      const parsedDate = new Date(rawFecha);
      if (!isNaN(parsedDate.getTime())) {
        fechaExig = parsedDate;
      }
    }

    const cliente = ((input.Cliente ?? input.cliente ?? null) as string | null) ?? null;
    const producto = ((input.Producto ?? input.producto ?? null) as string | null) ?? null;
    const total =
      input.Total !== undefined
        ? String(input.Total)
        : input.total !== undefined
        ? String(input.total)
        : null;
    const pagado = Boolean(input.Pagado ?? input.pagado ?? false);
    const mora =
      input.Mora !== undefined
        ? String(input.Mora)
        : input.mora !== undefined
        ? String(input.mora)
        : "0";
    const correo = ((input.Correo ?? input.correo ?? null) as string | null) ?? null;
    const contacto = ((input.Contacto ?? input.contacto ?? null) as string | null) ?? null;
    const rfc = ((input.RFC ?? input.rfc ?? null) as string | null) ?? null;
    const personalidad =
      ((input.Personalidad ?? input.personalidad ?? null) as string | null) ?? null;
    const extIdRaw = input.id ?? input.externalId;
    const externalId =
      extIdRaw !== undefined && extIdRaw !== null && !isNaN(Number(extIdRaw))
        ? Number(extIdRaw)
        : null;

    return {
      folio: folioNum,
      phone,
      rawPhone: rawPhone || null,
      cliente,
      fechaExigibilidad: fechaExig,
      producto,
      total,
      pagado,
      mora,
      correo,
      contacto,
      rfc,
      personalidad,
      externalId,
      rawPayload: input as Record<string, unknown>,
    };
  });

  // 2. Buscar contactos existentes por teléfono canónico
  const distinctPhones = Array.from(
    new Set(parsedItems.map((p) => p.phone).filter(Boolean))
  );

  const matchedContacts =
    distinctPhones.length > 0
      ? await db
          .select({
            id: schema.contact.id,
            phone: schema.contact.phone,
            waIdentity: schema.contact.waIdentity,
          })
          .from(schema.contact)
          .where(
            scoped(
              schema.contact.organizationId,
              organizationId,
              or(
                inArray(schema.contact.phone, distinctPhones),
                inArray(schema.contact.waIdentity, distinctPhones)
              )
            )
          )
      : [];

  const phoneToContactId = new Map<string, string>();
  for (const c of matchedContacts) {
    if (c.phone) phoneToContactId.set(c.phone, c.id);
    if (c.waIdentity) phoneToContactId.set(c.waIdentity, c.id);
  }

  // 3. Preparar filas deduplicando por folio dentro del mismo batch
  const rowsMap = new Map<number, typeof schema.contactFolio.$inferInsert>();
  for (const p of parsedItems) {
    if (!p.folio || isNaN(p.folio)) continue;
    const contactId = phoneToContactId.get(p.phone) ?? null;

    rowsMap.set(p.folio, {
      id: newId("contactFolio"),
      organizationId,
      folio: p.folio,
      contactId,
      phone: p.phone,
      rawPhone: p.rawPhone,
      cliente: p.cliente,
      fechaExigibilidad: p.fechaExigibilidad,
      producto: p.producto,
      total: p.total,
      pagado: p.pagado,
      mora: p.mora,
      correo: p.correo,
      contacto: p.contacto,
      rfc: p.rfc,
      personalidad: p.personalidad,
      externalId: p.externalId,
      rawPayload: p.rawPayload,
      updatedAt: new Date(),
    });
  }

  const valuesToUpsert = Array.from(rowsMap.values());
  if (valuesToUpsert.length === 0) return [];

  const result = await db
    .insert(schema.contactFolio)
    .values(valuesToUpsert)
    .onConflictDoUpdate({
      target: [schema.contactFolio.organizationId, schema.contactFolio.folio],
      set: {
        contactId: sql`coalesce(excluded.contact_id, ${schema.contactFolio.contactId})`,
        phone: sql`excluded.phone`,
        rawPhone: sql`excluded.raw_phone`,
        cliente: sql`excluded.cliente`,
        fechaExigibilidad: sql`excluded.fecha_exigibilidad`,
        producto: sql`excluded.producto`,
        total: sql`excluded.total`,
        pagado: sql`excluded.pagado`,
        mora: sql`excluded.mora`,
        correo: sql`excluded.correo`,
        contacto: sql`excluded.contacto`,
        rfc: sql`excluded.rfc`,
        personalidad: sql`excluded.personalidad`,
        externalId: sql`excluded.external_id`,
        rawPayload: sql`excluded.raw_payload`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return result;
}

/**
 * Consulta los folios asociados a un contacto por contactId o por su teléfono canónico.
 */
export async function getFoliosForContact(
  organizationId: string,
  contactId: string
) {
  const db = getDb();
  const [contactRow] = await db
    .select({
      id: schema.contact.id,
      phone: schema.contact.phone,
      waIdentity: schema.contact.waIdentity,
    })
    .from(schema.contact)
    .where(
      scoped(
        schema.contact.organizationId,
        organizationId,
        eq(schema.contact.id, contactId)
      )
    )
    .limit(1);

  if (!contactRow) return [];

  const conditions = [eq(schema.contactFolio.contactId, contactRow.id)];
  if (contactRow.phone) {
    conditions.push(eq(schema.contactFolio.phone, contactRow.phone));
  }
  if (contactRow.waIdentity) {
    conditions.push(eq(schema.contactFolio.phone, contactRow.waIdentity));
  }

  const folios = await db
    .select()
    .from(schema.contactFolio)
    .where(
      scoped(
        schema.contactFolio.organizationId,
        organizationId,
        or(...conditions)
      )
    )
    .orderBy(desc(schema.contactFolio.folio));

  // Auto-enlace en cascada si existían folios huérfanos con el mismo teléfono
  const unlinked = folios.filter((f) => !f.contactId);
  if (unlinked.length > 0) {
    await db
      .update(schema.contactFolio)
      .set({ contactId: contactRow.id })
      .where(
        scoped(
          schema.contactFolio.organizationId,
          organizationId,
          inArray(
            schema.contactFolio.id,
            unlinked.map((f) => f.id)
          )
        )
      );
  }

  return folios;
}

export const getFoliosByContact = getFoliosForContact;

/**
 * Consulta folios para una lista de contactos en un solo viaje a la BD.
 */
export async function getFoliosGroupedByContact(
  organizationId: string,
  contacts: { id: string; phone?: string | null; waIdentity?: string | null }[]
): Promise<Map<string, ContactFolioSummaryDto[]>> {
  const result = new Map<string, ContactFolioSummaryDto[]>();
  if (contacts.length === 0) return result;

  const db = getDb();
  const contactIds = contacts.map((c) => c.id);
  const phones = Array.from(
    new Set(
      contacts
        .flatMap((c) => [c.phone, c.waIdentity])
        .filter((p): p is string => Boolean(p))
    )
  );

  const conditions = [inArray(schema.contactFolio.contactId, contactIds)];
  if (phones.length > 0) {
    conditions.push(inArray(schema.contactFolio.phone, phones));
  }

  const folios = await db
    .select()
    .from(schema.contactFolio)
    .where(
      scoped(
        schema.contactFolio.organizationId,
        organizationId,
        or(...conditions)
      )
    )
    .orderBy(desc(schema.contactFolio.folio));

  // Mapa de teléfono -> id de contacto
  const phoneToContact = new Map<string, string>();
  for (const c of contacts) {
    if (c.phone) phoneToContact.set(c.phone, c.id);
    if (c.waIdentity) phoneToContact.set(c.waIdentity, c.id);
  }

  for (const f of folios) {
    const cid = f.contactId ?? phoneToContact.get(f.phone);
    if (!cid) continue;
    const list = result.get(cid) ?? [];
    list.push(serializeFolioSummary(f));
    result.set(cid, list);
  }

  return result;
}

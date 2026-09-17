import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import { sql, and, inArray, eq } from "drizzle-orm";
import { newId } from "@/lib/db/ids";
import { linkRecordsToContacts } from "@/server/cobranza/contact-linker";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  uploadType: z.enum(["due", "late"]),
  records: z.array(z.any()),
  productType: z.string().optional(),
});

export const POST = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza no está habilitada");
  }

  const body = await parseBody(req, confirmSchema);
  if (!body.ok) return body.response;

  const { uploadType, records, productType } = body.data;
  const db = getDb();

  // Create upload log
  await db.insert(schema.collectionUpload).values({
    id: newId("cu"),
    organizationId: session.organizationId,
    fileName: `Upload-${new Date().toISOString()}`,
    uploadType,
    productType: productType || null,
    recordCount: records.length,
    uploadedBy: session.userId,
  });

  // Upsert records
  let inserted = 0;
  const updated = 0;

  if (records.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = records.map((r: any) => ({
      id: newId("cr"),
      organizationId: session.organizationId,
      folio: String(r.folio),
      clientName: String(r.clientName),
      phone: r.phone ? String(r.phone) : null,
      email: r.email ? String(r.email) : null,
      contactName: r.contactName ? String(r.contactName) : null,
      rfc: r.rfc ? String(r.rfc) : null,
      personalidad: r.personalidad || null,
      product: productType || "PRESTAMOS",
      dueDate: r.dueDate ? new Date(r.dueDate) : null,
      totalAmount: r.totalAmount || null,
      lateAmount: r.lateAmount || null,
      paid: Boolean(r.paid),
      status: "active" as const,
    }));

    // BATCH_SIZE
    const BATCH_SIZE = 500;
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      await db
        .insert(schema.collectionRecord)
        .values(batch)
        .onConflictDoUpdate({
          target: [
            schema.collectionRecord.organizationId,
            schema.collectionRecord.folio,
          ],
          set: {
            clientName: sql`EXCLUDED.client_name`,
            phone: sql`EXCLUDED.phone`,
            email: sql`EXCLUDED.email`,
            contactName: sql`EXCLUDED.contact_name`,
            rfc: sql`EXCLUDED.rfc`,
            personalidad: sql`EXCLUDED.personalidad`,
            product: sql`EXCLUDED.product`,
            dueDate: sql`EXCLUDED.due_date`,
            totalAmount: sql`EXCLUDED.total_amount`,
            lateAmount: sql`EXCLUDED.late_amount`,
            paid: sql`EXCLUDED.paid`,
            updatedAt: sql`now()`,
          },
        });
    }

    inserted = records.length; // Approximate, assuming mostly inserts
  }

  // Find all records to link them
  const recordIds = [];
  if (records.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const folios = records.map((r: any) => String(r.folio));
    const BATCH_SIZE = 500;
    for (let i = 0; i < folios.length; i += BATCH_SIZE) {
      const batchFolios = folios.slice(i, i + BATCH_SIZE);
      const insertedRecords = await db
        .select({ id: schema.collectionRecord.id })
        .from(schema.collectionRecord)
        .where(
          and(
            eq(schema.collectionRecord.organizationId, session.organizationId),
            inArray(schema.collectionRecord.folio, batchFolios)
          )
        );
      recordIds.push(...insertedRecords.map(r => r.id));
    }
  }

  const linkResult = await linkRecordsToContacts(session.organizationId, recordIds);

  return Response.json({
    inserted,
    updated,
    total: records.length,
    linked: linkResult.linked,
    created: linkResult.created,
  });
});

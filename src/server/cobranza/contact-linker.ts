import { eq, and, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { normalizeMx } from "@/lib/meta/client";
import { newId } from "@/lib/db/ids";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BSUID_PREFIX } from "@/server/inbox/identity";

export interface LinkResult {
  linked: number;
  created: number;
  skipped: number;
}

export async function linkRecordsToContacts(
  organizationId: string,
  recordIds: string[]
): Promise<LinkResult> {
  if (recordIds.length === 0) {
    return { linked: 0, created: 0, skipped: 0 };
  }

  const db = getDb();
  let linked = 0;
  let created = 0;
  let skipped = 0;

  // 1. Fetch the records
  const records = await db
    .select()
    .from(schema.collectionRecord)
    .where(
      and(
        eq(schema.collectionRecord.organizationId, organizationId),
        inArray(schema.collectionRecord.id, recordIds)
      )
    );

  // Get the "Nuevo" pipeline stage
  const stages = await db
    .select()
    .from(schema.pipelineStage)
    .where(eq(schema.pipelineStage.organizationId, organizationId));
  
  const nuevoStage = stages.find((s) => s.name.toLowerCase() === "nuevo") || stages[0];

  for (const record of records) {
    if (!record.phone) {
      skipped++;
      continue;
    }

    const normalizedPhone = normalizeMx(record.phone.replace(/[^0-9]/g, ""));
    if (!normalizedPhone) {
      skipped++;
      continue;
    }

    // 2. Search contacts by phone or waIdentity
    const existingContacts = await db
      .select()
      .from(schema.contact)
      .where(
        and(
          eq(schema.contact.organizationId, organizationId),
          eq(schema.contact.waIdentity, normalizedPhone)
        )
      )
      .limit(1);

    let contactId = existingContacts[0]?.id;

    if (!contactId) {
      // 4. Create contact if NOT found
      contactId = newId("contact");
      await db.insert(schema.contact).values({
        id: contactId,
        organizationId,
        waIdentity: normalizedPhone,
        phone: normalizedPhone,
        name: record.clientName || "Contacto de Cobranza",
        source: "otro",
        // Ficha fields
        ficha: {
          cobranza_folio: record.folio,
          cobranza_product: record.product,
        },
      });

      // Insert Lead to place in pipeline
      if (nuevoStage) {
        await db.insert(schema.lead).values({
          id: newId("lead"),
          organizationId,
          contactId,
          stageId: nuevoStage.id,
          position: 0,
        });
      }

      created++;
    } else {
      // 5. Store folio + product in existing contact's ficha
      const existingContact = existingContacts[0];
      if (existingContact) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ficha = (existingContact.ficha as Record<string, any>) || {};
        ficha.cobranza_folio = record.folio;
        ficha.cobranza_product = record.product;

        await db
          .update(schema.contact)
          .set({ ficha })
          .where(eq(schema.contact.id, contactId));

        linked++;
      }
    }

    // 3. Link record to contact
    await db
      .update(schema.collectionRecord)
      .set({ contactId })
      .where(eq(schema.collectionRecord.id, record.id));
  }

  return { linked, created, skipped };
}

import { NextResponse } from "next/server";
import { getDb, schema } from "../../../../../../lib/db";
import { eq, and } from "drizzle-orm";
import { validateRequestApiKey } from "../../../../../../lib/auth/public-api";
import { getOrCreateContactByIdentity, BSUID_PREFIX } from "../../../../../../server/inbox/identity";
import { getOrCreateConversation } from "../../../../../../server/inbox/ingest";
import { normalizeMx } from "../../../../../../lib/meta/client";
import { upsertContactFolios } from "../../../../../../server/folios";
import { moveLeadToStage } from "../../../../../../server/leads/stage-history";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { organizationId } = auth;
  const db = getDb();
  
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const records = body.records;
  if (!Array.isArray(records)) {
    return NextResponse.json({ error: "records must be an array" }, { status: 400 });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const queueIds = [];

  for (const record of records) {
    try {
      if (!record.phone && !record.waUserId) {
         throw new Error("Missing phone and waUserId");
      }
      
      const phoneStr = record.phone ? normalizeMx(String(record.phone)) : null;
      const identityStr = phoneStr ? phoneStr : `${BSUID_PREFIX}${record.waUserId}`;
      const resolved = {
        identity: identityStr,
        phone: phoneStr,
        waUserId: record.waUserId ?? null,
        profileName: record.name ?? null,
      };

      const { contact } = await getOrCreateContactByIdentity(organizationId, resolved);
      await getOrCreateConversation(organizationId, contact.id);

      // Upsert Folio
      if (record.folio !== undefined) {
         await upsertContactFolios(organizationId, [{ ...record, phone: contact.phone }]);
      }

      // Find template
      const templates = await db.select().from(schema.template).where(
        and(
          eq(schema.template.organizationId, organizationId),
          eq(schema.template.name, record.templateName),
          eq(schema.template.language, record.templateLanguage ?? "es_MX")
        )
      ).limit(1);
      const template = templates[0];
      if (!template) {
        throw new Error(`Template not found: ${record.templateName}`);
      }

      // Move Lead to stage if template has pipelineStageId mapped
      if (template.pipelineStageId) {
         const leads = await db.select().from(schema.lead).where(
            and(
              eq(schema.lead.organizationId, organizationId),
              eq(schema.lead.contactId, contact.id)
            )
         ).limit(1);
         if (leads[0]) {
           await moveLeadToStage({
             organizationId,
             leadId: leads[0].id,
             toStageId: template.pipelineStageId,
             source: "sistema" // changed from "bot" to "sistema" based on standard types
           });
         }
      }

      // Queue message
      const outboxId = randomUUID();
      await db.insert(schema.outboxMessage).values({
        id: outboxId,
        organizationId,
        type: "template",
        payload: {
          to: contact.id,
          templateId: template.id,
          variables: record.templateVariables ?? {}
        },
        status: "pending"
      });
      queueIds.push(outboxId);
      successCount++;
    } catch (e) {
      errorCount++;
      errors.push({ payload: record, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: records.length,
      success: successCount,
      error: errorCount,
    },
    queueIds,
    errors: errors.length > 0 ? errors : undefined,
  });
}

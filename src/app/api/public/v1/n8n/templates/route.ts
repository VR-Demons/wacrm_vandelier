import { NextResponse } from "next/server";
import { getDb, schema } from "../../../../../../lib/db";
import { eq, and } from "drizzle-orm";
import { validateRequestApiKey } from "../../../../../../lib/auth/public-api";
import { getOrCreateContactByIdentity, BSUID_PREFIX } from "../../../../../../server/inbox/identity";
import { getOrCreateConversation } from "../../../../../../server/inbox/ingest";
import { normalizeMx } from "../../../../../../lib/meta/client";
import { upsertContactFolios } from "../../../../../../server/folios";
import { moveLeadToStage } from "../../../../../../server/leads/stage-history";
import { sendTemplate, TemplateError } from "../../../../../../server/whatsapp/templates";
import { SendError } from "../../../../../../server/inbox/send";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { organizationId } = auth;
  const db = getDb();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const records = Array.isArray(body)
    ? body
    : Array.isArray(body?.records)
    ? body.records
    : body && typeof body === "object"
    ? [body]
    : [];

  if (records.length === 0) {
    return NextResponse.json({ error: "Payload must be a record or an array of records" }, { status: 400 });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const queueIds = [];
  const sentMessageIds = [];

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
      const conv = await getOrCreateConversation(organizationId, contact.id);

      // Upsert Folio
      if (record.folio !== undefined) {
         await upsertContactFolios(organizationId, [{ ...record, phone: contact.phone }]);
      }

      // Find template
      const templateName = record.templateName ?? record.template;
      const templateLang = record.templateLanguage ?? record.language ?? "es_MX";
      const templates = await db.select().from(schema.template).where(
        and(
          eq(schema.template.organizationId, organizationId),
          eq(schema.template.name, templateName),
          eq(schema.template.language, templateLang)
        )
      ).limit(1);
      const template = templates[0];
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
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
             source: "sistema"
           });
         }
      }

      const variables = record.templateVariables ?? record.variables ?? record.parameters ?? {};

      if (record.immediate === true) {
        const result = await sendTemplate({
          organizationId,
          conversationId: conv.id,
          templateId: template.id,
          variables,
        });
        sentMessageIds.push(result.messageId);
        successCount++;
      } else {
        // Queue message
        const outboxId = randomUUID();
        await db.insert(schema.outboxMessage).values({
          id: outboxId,
          organizationId,
          type: "template",
          payload: {
            to: contact.id,
            templateId: template.id,
            variables
          },
          status: "pending"
        });
        queueIds.push(outboxId);
        successCount++;
      }
    } catch (e) {
      errorCount++;
      const message =
        e instanceof SendError || e instanceof TemplateError
          ? `${e.code}: ${e.message}`
          : (e as Error).message;
      errors.push({ payload: record, error: message });
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: records.length,
      success: successCount,
      error: errorCount,
    },
    queueIds: queueIds.length > 0 ? queueIds : undefined,
    sentMessageIds: sentMessageIds.length > 0 ? sentMessageIds : undefined,
    errors: errors.length > 0 ? errors : undefined,
  });
}

import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { conversation, outboxMessage, template, lead } from "../../../../../lib/db/schema";
import { and, eq } from "drizzle-orm";
import { validateRequestApiKey } from "../../../../../lib/auth/public-api";
import { getOrCreateContactByIdentity } from "../../../../../server/inbox/identity";
import { getOrCreateConversation } from "../../../../../server/inbox/ingest";
import { normalizeContactPhone } from "../../../../../lib/phone";
import { sendText, SendError } from "../../../../../server/inbox/send";
import { sendTemplate, TemplateError } from "../../../../../server/whatsapp/templates";
import { moveLeadToStage } from "../../../../../server/leads/stage-history";
import { randomUUID } from "crypto";

function normalizeVariables(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const map: Record<string, string> = {};
    raw.forEach((v, idx) => {
      const key = String(idx + 1);
      map[key] = String(v ?? "");
      map[`body_${key}`] = String(v ?? "");
    });
    return map;
  }
  if (typeof raw === "object") {
    const map: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      map[k] = String(v ?? "");
      if (/^\d+$/.test(k)) {
        map[`body_${k}`] = String(v ?? "");
      }
    }
    return map;
  }
  return {};
}

export async function POST(req: Request) {
  const db = getDb();
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { organizationId } = auth;
  const isBatch = Array.isArray(body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = isBatch ? (body as any[]) : [body];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const queueIds = [];
  const sentMessageIds = [];

  for (const msg of messages) {
    const templateIdentifier = msg.template ?? msg.templateName ?? msg.templateId;
    const isTemplate = Boolean(templateIdentifier);
    const text = msg.message ?? msg.text;
    const phoneRaw = msg.phone ?? msg.number ?? msg.to;
    let contactId = msg.contactId;

    if (!isTemplate && !text) {
      errorCount++;
      errors.push({ payload: msg, error: "Missing message/text or template/templateName" });
      continue;
    }

    if (!contactId && !phoneRaw) {
      errorCount++;
      errors.push({ payload: msg, error: "Missing phone or contactId" });
      continue;
    }

    try {
      if (!contactId && phoneRaw) {
        const phoneStr = normalizeContactPhone(String(phoneRaw));
        const { contact } = await getOrCreateContactByIdentity(organizationId, {
          identity: phoneStr,
          phone: phoneStr,
          waUserId: null,
          profileName: msg.name ?? null,
        });
        contactId = contact.id;
        await getOrCreateConversation(organizationId, contact.id);
      }

      if (isTemplate) {
        const lang = msg.language ?? msg.templateLanguage ?? "es_MX";
        const templateStr = String(templateIdentifier);

        // Find template by ID first, then by name + language, then by name alone
        let tpl = await db.query.template.findFirst({
          where: and(
            eq(template.organizationId, organizationId),
            eq(template.id, templateStr)
          ),
        });
        if (!tpl) {
          tpl = await db.query.template.findFirst({
            where: and(
              eq(template.organizationId, organizationId),
              eq(template.name, templateStr),
              eq(template.language, lang)
            ),
          });
        }
        if (!tpl) {
          tpl = await db.query.template.findFirst({
            where: and(
              eq(template.organizationId, organizationId),
              eq(template.name, templateStr)
            ),
          });
        }

        if (!tpl) {
          throw new Error(`Template not found: '${templateStr}'`);
        }
        if (tpl.status !== "approved") {
          throw new Error(`Template '${tpl.name}' is not approved (status: ${tpl.status})`);
        }

        const normalizedVars = normalizeVariables(
          msg.variables ?? msg.parameters ?? msg.templateVariables
        );

        // Move Lead to stage if template has pipelineStageId mapped
        if (tpl.pipelineStageId) {
          const leads = await db
            .select()
            .from(lead)
            .where(
              and(
                eq(lead.organizationId, organizationId),
                eq(lead.contactId, contactId)
              )
            )
            .limit(1);
          if (leads[0]) {
            await moveLeadToStage({
              organizationId,
              leadId: leads[0].id,
              toStageId: tpl.pipelineStageId,
              source: "sistema",
            });
          }
        }

        if (msg.immediate === true) {
          const conv = await db.query.conversation.findFirst({
            where: and(
              eq(conversation.organizationId, organizationId),
              eq(conversation.contactId, contactId)
            ),
          });
          if (!conv) {
            throw new Error("Conversation not found for contact");
          }

          const result = await sendTemplate({
            organizationId,
            conversationId: conv.id,
            templateId: tpl.id,
            variables: normalizedVars,
          });
          sentMessageIds.push(result.messageId);
          successCount++;
        } else {
          const id = randomUUID();
          await db.insert(outboxMessage).values({
            id,
            organizationId,
            type: "template",
            payload: {
              to: contactId,
              templateId: tpl.id,
              variables: normalizedVars,
            },
            status: "pending",
          });
          queueIds.push(id);
          successCount++;
        }
      } else {
        // Plain text message
        if (msg.immediate === true) {
          const conv = await db.query.conversation.findFirst({
            where: and(
              eq(conversation.organizationId, organizationId),
              eq(conversation.contactId, contactId)
            ),
          });
          if (!conv) {
            throw new Error("Conversation not found for contact");
          }

          const result = await sendText({
            conversationId: conv.id,
            organizationId,
            text: String(text),
          });
          sentMessageIds.push(result.messageId);
          successCount++;
        } else {
          const id = randomUUID();
          await db.insert(outboxMessage).values({
            id,
            organizationId,
            payload: {
              to: contactId,
              text: String(text),
              type: "text",
            },
            status: "pending",
          });
          queueIds.push(id);
          successCount++;
        }
      }
    } catch (err) {
      errorCount++;
      const message =
        err instanceof SendError || err instanceof TemplateError
          ? `${err.code}: ${err.message}`
          : (err as Error).message;
      errors.push({ payload: msg, error: message });
    }
  }

  return NextResponse.json({
    success: errorCount === 0 || successCount > 0,
    summary: {
      total: messages.length,
      success: successCount,
      error: errorCount,
    },
    queueIds: queueIds.length > 0 ? queueIds : undefined,
    sentMessageIds: sentMessageIds.length > 0 ? sentMessageIds : undefined,
    errors: errors.length > 0 ? errors : undefined,
  });
}

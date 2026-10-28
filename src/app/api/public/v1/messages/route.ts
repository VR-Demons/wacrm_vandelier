import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { conversation, outboxMessage } from "../../../../../lib/db/schema";
import { and, eq } from "drizzle-orm";
import { validateRequestApiKey } from "../../../../../lib/auth/public-api";
import { getOrCreateContactByIdentity } from "../../../../../server/inbox/identity";
import { getOrCreateConversation } from "../../../../../server/inbox/ingest";
import { normalizeContactPhone } from "../../../../../lib/phone";
import { sendText, SendError } from "../../../../../server/inbox/send";
import { randomUUID } from "crypto";

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
    const text = msg.message ?? msg.text;
    const phoneRaw = msg.phone ?? msg.number ?? msg.to;
    let contactId = msg.contactId;

    if (!text || (!contactId && !phoneRaw)) {
      errorCount++;
      errors.push({ payload: msg, error: "Missing (phone or contactId) and (message or text)" });
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
    } catch (err) {
      errorCount++;
      const message =
        err instanceof SendError
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

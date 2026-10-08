import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { outboxMessage, organization, conversation } from "../../../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendText } from "../../../../../server/inbox/send";

export async function POST(req: Request) {
  const db = getDb();
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingMessages = await db.query.outboxMessage.findMany({
    where: eq(outboxMessage.status, "pending"),
    orderBy: (outboxMessage, { asc }) => [asc(outboxMessage.createdAt)],
    limit: 100, // Process up to 100 per run
  });

  if (pendingMessages.length === 0) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  // Group by organization to fetch delay limits
  const orgIds = [...new Set(pendingMessages.map(m => m.organizationId))];
  const orgSettings = new Map();
  
  for (const orgId of orgIds) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
    });
    // Default to 1000ms if not set
    orgSettings.set(orgId, org?.outboxDelayLimit ?? 1000);
  }

  let processedCount = 0;

  for (const msg of pendingMessages) {
    try {
      // Find the conversation for this contact
      const payload = msg.payload as { to: string; text: string };
      const contactId = payload.to;
      const conv = await db.query.conversation.findFirst({
        where: and(
          eq(conversation.organizationId, msg.organizationId),
          eq(conversation.contactId, contactId)
        ),
      });

      if (!conv) {
        throw new Error("Conversation not found for contact");
      }

      await sendText({
        conversationId: conv.id,
        organizationId: msg.organizationId,
        text: payload.text,
      });

      await db
        .update(outboxMessage)
        .set({ status: "sent", error: null })
        .where(eq(outboxMessage.id, msg.id));
        
      processedCount++;
    } catch (err) {
      await db
        .update(outboxMessage)
        .set({ status: "failed", error: (err as Error).message })
        .where(eq(outboxMessage.id, msg.id));
    }

    const delayMs = orgSettings.get(msg.organizationId);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return NextResponse.json({ success: true, processed: processedCount });
}

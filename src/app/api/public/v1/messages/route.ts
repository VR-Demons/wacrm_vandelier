import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { outboxMessage } from "../../../../../lib/db/schema";
import { validateRequestApiKey } from "../../../../../lib/auth/public-api";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const db = getDb();
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { organizationId } = auth;
  const isBatch = Array.isArray(body);
  const messages = isBatch ? body : [body];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const queueIds = [];

  for (const msg of messages) {
    if (!msg.contactId || !msg.message) {
      errorCount++;
      errors.push({ payload: msg, error: "Missing contactId or message" });
      continue;
    }

    try {
      const id = randomUUID();
      await db.insert(outboxMessage).values({
        id,
        organizationId,
        payload: {
          to: msg.contactId,
          text: msg.message,
          type: "text"
        },
        status: "pending",
      });
      queueIds.push(id);
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ payload: msg, error: (err as Error).message });
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: messages.length,
      success: successCount,
      error: errorCount,
    },
    queueIds,
    errors: errors.length > 0 ? errors : undefined,
  });
}

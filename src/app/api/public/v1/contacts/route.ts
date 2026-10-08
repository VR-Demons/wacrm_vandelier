import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { contact } from "../../../../../lib/db/schema";
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
  const contacts = isBatch ? body : [body];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const c of contacts) {
    if (!c.name || !c.phone) {
      errorCount++;
      errors.push({ contact: c, error: "Missing name or phone" });
      continue;
    }

    try {
      await db
        .insert(contact)
        .values({
          id: randomUUID(),
          organizationId,
          waIdentity: c.phone,
          phone: c.phone,
          name: c.name,
          source: "otro",
        })
        .onConflictDoUpdate({
          target: [contact.organizationId, contact.channel, contact.waIdentity],
          set: {
            name: c.name,
            phone: c.phone,
          },
        });
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ contact: c, error: (err as Error).message });
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: contacts.length,
      success: successCount,
      error: errorCount,
    },
    errors: errors.length > 0 ? errors : undefined,
  });
}

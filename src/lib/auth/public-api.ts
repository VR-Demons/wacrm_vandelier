import { NextResponse } from "next/server";
import { getDb } from "../db";
import { validateApiKey } from "./api-key";

export async function validateRequestApiKey(req: Request): Promise<{ organizationId: string } | null> {
  const db = getDb();
  const key = req.headers.get("x-api-key");
  if (!key) {
    return null;
  }

  const prefix = key.substring(0, 12);
  const keyRecord = await db.query.apiKey.findFirst({
    where: (apiKey, { eq }) => eq(apiKey.prefix, prefix),
  });

  if (!keyRecord) {
    return null;
  }

  const isValid = await validateApiKey(key, keyRecord.keyHash);
  if (!isValid) {
    return null;
  }

  return { organizationId: keyRecord.organizationId };
}

export async function requirePublicApiKey(req: Request): Promise<{ organizationId?: string; error?: Response }> {
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { organizationId: auth.organizationId };
}

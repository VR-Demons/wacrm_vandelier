"use server";

import { getDb } from "../../../../lib/db";
import { apiKey, organization } from "../../../../lib/db/schema";
import { generateApiKey } from "../../../../lib/auth/api-key";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function generateNewApiKey(organizationId: string) {
  try {
    const db = getDb();
    const { key, hash, prefix } = await generateApiKey();
    
    await db.transaction(async (tx) => {
      await tx.delete(apiKey).where(eq(apiKey.organizationId, organizationId));
      await tx.insert(apiKey).values({
        id: randomUUID(),
        organizationId,
        keyHash: hash,
        prefix,
      });
    });

    return { key };
  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }
}

export async function revokeApiKey(organizationId: string) {
  try {
    const db = getDb();
    await db.delete(apiKey).where(eq(apiKey.organizationId, organizationId));
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }
}

export async function updateOutboxDelayLimit(organizationId: string, limit: number) {
  try {
    const db = getDb();
    await db.update(organization).set({ outboxDelayLimit: limit }).where(eq(organization.id, organizationId));
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }
}

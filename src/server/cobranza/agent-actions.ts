import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const markAsPaidSchema = z.object({
  folio: z.string().describe("The folio of the debt record to mark as paid"),
});

export async function markAsPaid(folio: string) {
  const db = getDb();
  await db
    .update(schema.collectionRecord)
    .set({ status: "ya_pague" })
    .where(eq(schema.collectionRecord.folio, folio));
}

export const markAsWrongNumberSchema = z.object({
  folio: z.string().describe("The folio of the debt record to mark as wrong number"),
});

export async function markAsWrongNumber(folio: string) {
  const db = getDb();
  await db
    .update(schema.collectionRecord)
    .set({ status: "wrong_number" })
    .where(eq(schema.collectionRecord.folio, folio));
}

export const markAsResolvedSchema = z.object({
  folio: z.string().describe("The folio of the debt record to mark as resolved"),
});

export async function markAsResolved(folio: string) {
  const db = getDb();
  await db
    .update(schema.collectionRecord)
    .set({ status: "resolved" })
    .where(eq(schema.collectionRecord.folio, folio));
}

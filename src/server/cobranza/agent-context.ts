import { getDb, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { cobranzaEnabled } from "./flag";

export async function getDebtContext(orgId: string, contactId: string): Promise<any> {
  if (!cobranzaEnabled()) {
    return null;
  }

  const db = getDb();
  const records = await db
    .select({
      product: schema.collectionRecord.product,
      folio: schema.collectionRecord.folio,
      dueDate: schema.collectionRecord.dueDate,
    })
    .from(schema.collectionRecord)
    .where(
      and(
        eq(schema.collectionRecord.organizationId, orgId),
        eq(schema.collectionRecord.contactId, contactId),
        eq(schema.collectionRecord.status, "active"),
        eq(schema.collectionRecord.paid, false)
      )
    );

  if (records.length === 0) {
    return {
      hasDebt: false,
      records: [],
    };
  }

  const now = new Date();
  const mappedRecords = records.map((record) => {
    const isOverdue = record.dueDate ? record.dueDate < now : false;
    return {
      product: record.product,
      folio: record.folio,
      dueDate: record.dueDate,
      isOverdue,
    };
  });

  return {
    hasDebt: true,
    records: mappedRecords,
  };
}

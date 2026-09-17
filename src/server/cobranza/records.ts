import { asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { scoped } from "@/lib/db/tenant";

export type ListRecordsOptions = {
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page: number;
  pageSize: number;
  status?: string;
  dateFilter?: string;
};

export async function listRecords(orgId: string, options: ListRecordsOptions) {
  const db = getDb();
  const { search, sort, dir, page, pageSize, status, dateFilter } = options;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(schema.collectionRecord.folio, `%${search}%`),
        ilike(schema.collectionRecord.clientName, `%${search}%`),
        ilike(schema.collectionRecord.phone, `%${search}%`),
        ilike(schema.collectionRecord.email, `%${search}%`)
      )
    );
  }

  if (status) {
    conditions.push(eq(schema.collectionRecord.status, status as any));
  }

  if (dateFilter) {
    conditions.push(
      sql`${schema.collectionRecord.dueDate}::date = ${dateFilter}::date`
    );
  }

  const where = scoped(
    schema.collectionRecord.organizationId,
    orgId,
    ...conditions
  );

  let orderBy = desc(schema.collectionRecord.createdAt);
  if (sort) {
    const column =
      schema.collectionRecord[sort as keyof typeof schema.collectionRecord];
    if (column) {
      orderBy = dir === "asc" ? asc(column as any) : desc(column as any);
    }
  }

  const [totalResult] = await db
    .select({ count: count() })
    .from(schema.collectionRecord)
    .where(where);

  const totalCount = totalResult?.count || 0;

  const records = await db
    .select()
    .from(schema.collectionRecord)
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    records,
    total: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getRecord(orgId: string, recordId: string) {
  const db = getDb();
  const [record] = await db
    .select()
    .from(schema.collectionRecord)
    .where(
      scoped(
        schema.collectionRecord.organizationId,
        orgId,
        eq(schema.collectionRecord.id, recordId)
      )
    );
  return record || null;
}

export async function updateRecord(
  orgId: string,
  recordId: string,
  data: Partial<typeof schema.collectionRecord.$inferInsert>
) {
  const db = getDb();

  const [updated] = await db
    .update(schema.collectionRecord)
    .set({ ...data, updatedAt: new Date() })
    .where(
      scoped(
        schema.collectionRecord.organizationId,
        orgId,
        eq(schema.collectionRecord.id, recordId)
      )
    )
    .returning();

  return updated || null;
}

export async function deleteAllRecords(orgId: string) {
  const db = getDb();

  const deleted = await db
    .delete(schema.collectionRecord)
    .where(scoped(schema.collectionRecord.organizationId, orgId))
    .returning({ id: schema.collectionRecord.id });

  return deleted.length;
}

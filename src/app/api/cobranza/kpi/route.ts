import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { withAuth, apiError } from "@/lib/api";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { cobranzaEnabled } from "@/server/cobranza/flag";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza disabled");
  }

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  const db = getDb();

  const filters = [eq(schema.collectionRun.organizationId, session.organizationId)];
  if (start) filters.push(gte(schema.collectionSendLog.sentAt, new Date(start)));
  if (end) filters.push(lte(schema.collectionSendLog.sentAt, new Date(end)));

  const aggregates = await db
    .select({
      status: schema.collectionSendLog.status,
      count: sql<number>`cast(count(${schema.collectionSendLog.id}) as integer)`,
    })
    .from(schema.collectionSendLog)
    .innerJoin(
      schema.collectionRun,
      eq(schema.collectionRun.id, schema.collectionSendLog.runId)
    )
    .where(and(...filters))
    .groupBy(schema.collectionSendLog.status);

  let totalSent = 0;
  let deliveredCount = 0;
  let readCount = 0;

  for (const row of aggregates) {
    if (row.status === "sent") {
      totalSent += row.count;
    } else if (row.status === "delivered") {
      totalSent += row.count;
      deliveredCount += row.count;
    } else if (row.status === "read") {
      totalSent += row.count;
      deliveredCount += row.count;
      readCount += row.count;
    }
  }

  return NextResponse.json({
    totalSent,
    deliveredCount,
    readCount,
  });
});

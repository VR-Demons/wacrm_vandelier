import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { eq, inArray, and, desc } from "drizzle-orm";
import { cobranzaEnabled } from "@/server/cobranza/flag";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza disabled");
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const db = getDb();
  const records = await db
    .select()
    .from(schema.collectionRecord)
    .where(
      and(
        eq(schema.collectionRecord.organizationId, session.organizationId),
        inArray(schema.collectionRecord.status, ["ya_pague", "wrong_number", "no_response"])
      )
    )
    .orderBy(desc(schema.collectionRecord.updatedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: records, page, limit });
});

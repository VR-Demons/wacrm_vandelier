import { NextResponse } from "next/server";
import { getSessionOrNull } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { cobranzaEnabled } from "@/server/cobranza/flag";

export async function GET(req: Request) {
  if (!cobranzaEnabled()) {
    return NextResponse.json({ error: "Cobranza disabled" }, { status: 404 });
  }

  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const db = getDb();
    const runs = await db
      .select()
      .from(schema.collectionRun)
      .where(eq(schema.collectionRun.organizationId, session.organizationId))
      .orderBy(desc(schema.collectionRun.startedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: runs, page, limit });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[cobranza/runs] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

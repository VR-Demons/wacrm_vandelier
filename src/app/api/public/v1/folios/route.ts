import { NextResponse } from "next/server";
import { requirePublicApiKey } from "../../../../../lib/auth/public-api";
import { upsertContactFolios, IngestFolioInput } from "../../../../../server/folios";

export async function POST(req: Request) {
  const { organizationId, error } = await requirePublicApiKey(req);
  if (error || !organizationId) {
    return error;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBatch = Array.isArray(body);
  const folios: IngestFolioInput[] = isBatch ? (body as IngestFolioInput[]) : [body as IngestFolioInput];

  try {
    const result = await upsertContactFolios(organizationId, folios);

    return NextResponse.json({
      success: true,
      summary: {
        total: folios.length,
        success: result.length,
      },
    });
  } catch (err) {
    console.error("Error upserting folios:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

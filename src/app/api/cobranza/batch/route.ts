import { NextResponse } from "next/server";
import { runBatch } from "@/server/cobranza/engine";
import { cobranzaEnabled } from "@/server/cobranza/flag";

export async function POST(req: Request) {
  if (!cobranzaEnabled()) {
    return NextResponse.json({ error: "Cobranza disabled" }, { status: 404 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (token !== process.env.COBRANZA_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orgId, runType } = body;

    if (!orgId || !runType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await runBatch(orgId, runType, "api");
    return NextResponse.json(result);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[cobranza/batch] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

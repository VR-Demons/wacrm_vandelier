import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { lead, leadStageEvent, pipelineStage } from "../../../../../lib/db/schema";
import { validateRequestApiKey } from "../../../../../lib/auth/public-api";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const db = getDb();
  const auth = await validateRequestApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contactId, state, lossReason } = body;
  if (!contactId || !state) {
    return NextResponse.json({ error: "Missing contactId or state" }, { status: 400 });
  }

  const { organizationId } = auth;

  const currentLead = await db.query.lead.findFirst({
    where: and(eq(lead.organizationId, organizationId), eq(lead.contactId, contactId)),
  });

  if (!currentLead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const targetStage = await db.query.pipelineStage.findFirst({
    where: and(eq(pipelineStage.organizationId, organizationId), eq(pipelineStage.kind, state)),
  });

  if (!targetStage) {
    return NextResponse.json({ error: "Target stage not found" }, { status: 400 });
  }

  if (currentLead.stageId === targetStage.id) {
    return NextResponse.json({ success: true, message: "Already in target stage" });
  }

  let fromStageName = "Unknown";
  if (currentLead.stageId) {
    const fromStage = await db.query.pipelineStage.findFirst({
      where: eq(pipelineStage.id, currentLead.stageId),
    });
    if (fromStage) fromStageName = fromStage.name;
  }

  const finalLossReason = state === "lost" ? (lossReason || "otro") : null;

  await db.transaction(async (tx) => {
    await tx
      .update(lead)
      .set({
        stageId: targetStage.id,
        updatedAt: new Date(),
      })
      .where(eq(lead.id, currentLead.id));

    await tx.insert(leadStageEvent).values({
      id: randomUUID(),
      organizationId,
      leadId: currentLead.id,
      contactId: currentLead.contactId,
      fromStageId: currentLead.stageId,
      fromStageName,
      toStageId: targetStage.id,
      toStageName: targetStage.name,
      toStageKind: targetStage.kind as never,
      lossReason: finalLossReason as never,
      source: "bot", 
    });
  });

  return NextResponse.json({ success: true });
}

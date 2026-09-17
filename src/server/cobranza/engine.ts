import { eq, and, isNotNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { sendTemplate } from "@/server/whatsapp/templates";
import { getOrCreateConversation } from "@/server/inbox/ingest";
import { createCollectionRateLimiter, withExponentialBackoff } from "./rate-limiter";
import { sendCollectionEmail } from "./email-sender";

const limiter = createCollectionRateLimiter(10); // 10 msgs/sec

export async function runBatch(
  orgId: string,
  runType: "preventivo" | "payday" | "atrasado" | "email",
  triggeredBy: string
) {
  const db = getDb();

  // 1. Check config
  const configs = await db
    .select()
    .from(schema.collectionWorkflowConfig)
    .where(eq(schema.collectionWorkflowConfig.organizationId, orgId))
    .limit(1);

  const config = configs[0];
  if (!config || !config.active) {
    return { success: false, reason: "Cobranza workflow is not active for this org" };
  }

  let isActive = false;
  let templateName: string | null = null;

  switch (runType) {
    case "preventivo":
      isActive = config.flowPreventivo ?? false;
      templateName = config.templatePreventivo ?? null;
      break;
    case "payday":
      isActive = config.flowPayday ?? false;
      templateName = config.templatePayday ?? null;
      break;
    case "atrasado":
      isActive = config.flowAtrasado ?? false;
      templateName = config.templateAtrasado ?? null;
      break;
    case "email":
      isActive = config.flowEmail ?? false;
      break;
  }

  if (!isActive) {
    return { success: false, reason: `Flow ${runType} is not active in config` };
  }

  let templateId: string | null = null;
  if (runType !== "email") {
    if (!templateName) {
      return { success: false, reason: `No template configured for ${runType}` };
    }
    const templates = await db
      .select()
      .from(schema.template)
      .where(
        and(
          eq(schema.template.organizationId, orgId),
          eq(schema.template.name, templateName),
          eq(schema.template.status, "approved")
        )
      )
      .limit(1);

    if (!templates[0]) {
      return { success: false, reason: `Template ${templateName} not found or not approved` };
    }
    templateId = templates[0].id;
  }

  // 2. Find eligible records
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const records = await db
    .select()
    .from(schema.collectionRecord)
    .where(
      and(
        eq(schema.collectionRecord.organizationId, orgId),
        eq(schema.collectionRecord.status, "active"),
        eq(schema.collectionRecord.paid, false),
        isNotNull(schema.collectionRecord.contactId),
        sql`${schema.collectionRecord.lastContactedAt} IS NULL OR ${schema.collectionRecord.lastContactedAt} < ${todayDate.toISOString()}`
      )
    );

  const eligibleRecords = records.filter(r => {
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (runType === "preventivo") return diffDays > 0 && diffDays <= 3;
    if (runType === "payday") return diffDays === 0;
    if (runType === "atrasado") return diffDays < 0;
    if (runType === "email") return diffDays < 0;
    return false;
  });

  if (eligibleRecords.length === 0) {
    return { success: true, eligible: 0, sent: 0, failed: 0 };
  }

  // 4. Create collectionRun
  const runId = newId("crun");
  await db.insert(schema.collectionRun).values({
    id: runId,
    organizationId: orgId,
    runType,
    triggeredBy,
    totalEligible: eligibleRecords.length,
    totalSent: 0,
    totalFailed: 0,
    status: "running",
  });

  let sent = 0;
  let failed = 0;

  // 5. Loop through eligible records
  for (const record of eligibleRecords) {
    const logId = newId("csl");
    await db.insert(schema.collectionSendLog).values({
      id: logId,
      runId,
      recordId: record.id,
      channel: runType === "email" ? "email" : "whatsapp",
      templateName,
      status: "queued",
    });

    try {
      await limiter.acquire();

      if (runType === "email") {
        if (!record.email) throw new Error("No email on record");
        await withExponentialBackoff(() => sendCollectionEmail(
          record.email!,
          `Aviso de cobro ${record.folio}`,
          `Hola ${record.clientName}, este es un aviso para su producto ${record.product}.`
        ));

        await db.update(schema.collectionSendLog)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(schema.collectionSendLog.id, logId));

      } else {
        if (!record.contactId) throw new Error("No contactId on record");
        const conversation = await getOrCreateConversation(orgId, record.contactId);
        const amountStr = record.totalAmount ? (record.totalAmount / 100).toFixed(2) : "0.00";
        
        const variables = [
          record.clientName || "",
          record.product || "",
          amountStr,
          record.folio || "",
          record.dueDate ? new Date(record.dueDate).toLocaleDateString() : ""
        ];
        
        // Safety padding to avoid 132000 invalid variables exception
        for (let i = variables.length; i < 10; i++) variables.push("");

        const { messageId } = await withExponentialBackoff(() => sendTemplate({
          organizationId: orgId,
          conversationId: conversation.id,
          templateId: templateId!,
          variables
        }));

        await db.update(schema.collectionSendLog)
          .set({ status: "sent", waMessageId: messageId, sentAt: new Date() })
          .where(eq(schema.collectionSendLog.id, logId));
      }

      sent++;
      await db.update(schema.collectionRecord)
        .set({ lastContactedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.collectionRecord.id, record.id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      failed++;
      await db.update(schema.collectionSendLog)
        .set({ status: "failed", error: err.message || "Unknown error", sentAt: new Date() })
        .where(eq(schema.collectionSendLog.id, logId));
    }
  }

  // 6. Update Run
  await db.update(schema.collectionRun)
    .set({
      status: "completed",
      totalSent: sent,
      totalFailed: failed,
      finishedAt: new Date(),
    })
    .where(eq(schema.collectionRun.id, runId));

  return { success: true, eligible: eligibleRecords.length, sent, failed };
}

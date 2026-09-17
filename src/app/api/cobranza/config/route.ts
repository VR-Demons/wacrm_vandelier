import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, apiError, parseBody } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cobranzaEnabled } from "@/server/cobranza/flag";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza disabled");
  }

  const db = getDb();
  let [config] = await db
    .select()
    .from(schema.collectionWorkflowConfig)
    .where(eq(schema.collectionWorkflowConfig.organizationId, session.organizationId));

  if (!config) {
    config = {
      organizationId: session.organizationId,
      active: false,
      flowPreventivo: true,
      flowPayday: true,
      flowAtrasado: true,
      flowEmail: false,
      templatePreventivo: null,
      templatePayday: null,
      templateAtrasado: null,
      updatedAt: new Date(),
    };
  }

  return NextResponse.json({ data: config });
});

const putConfigSchema = z.object({
  active: z.boolean(),
  flowPreventivo: z.boolean(),
  flowPayday: z.boolean(),
  flowAtrasado: z.boolean(),
  flowEmail: z.boolean(),
  templatePreventivo: z.string().nullable().optional(),
  templatePayday: z.string().nullable().optional(),
  templateAtrasado: z.string().nullable().optional(),
});

export const PUT = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza disabled");
  }

  const body = await parseBody(req, putConfigSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  const [updated] = await db
    .insert(schema.collectionWorkflowConfig)
    .values({
      organizationId: session.organizationId,
      active: body.data.active,
      flowPreventivo: body.data.flowPreventivo,
      flowPayday: body.data.flowPayday,
      flowAtrasado: body.data.flowAtrasado,
      flowEmail: body.data.flowEmail,
      templatePreventivo: body.data.templatePreventivo ?? null,
      templatePayday: body.data.templatePayday ?? null,
      templateAtrasado: body.data.templateAtrasado ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.collectionWorkflowConfig.organizationId,
      set: {
        active: body.data.active,
        flowPreventivo: body.data.flowPreventivo,
        flowPayday: body.data.flowPayday,
        flowAtrasado: body.data.flowAtrasado,
        flowEmail: body.data.flowEmail,
        templatePreventivo: body.data.templatePreventivo ?? null,
        templatePayday: body.data.templatePayday ?? null,
        templateAtrasado: body.data.templateAtrasado ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json({ data: updated });
});

import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { serializeTemplate } from "@/server/whatsapp/templates";

const updateSchema = z.object({
  pipelineStageId: z.string().nullable().optional(),
});

export const PATCH = withAuth(async (session, req: Request, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const body = await parseBody(req, updateSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  
  // Verify it belongs to org
  const existing = await db
    .select()
    .from(schema.template)
    .where(
      and(
        eq(schema.template.id, params.id),
        eq(schema.template.organizationId, session.organizationId)
      )
    )
    .limit(1);
    
  if (existing.length === 0) {
    return apiError(404, "not_found", "Plantilla no encontrada");
  }

  const updated = await db
    .update(schema.template)
    .set({
      pipelineStageId: body.data.pipelineStageId !== undefined ? body.data.pipelineStageId : existing[0]!.pipelineStageId,
      updatedAt: new Date()
    })
    .where(eq(schema.template.id, params.id))
    .returning();

  return Response.json({ template: serializeTemplate(updated[0]!) });
});

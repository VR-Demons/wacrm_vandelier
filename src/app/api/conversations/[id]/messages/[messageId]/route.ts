import { eq, and } from "drizzle-orm";
import { apiError, withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { scoped } from "@/lib/db/tenant";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; messageId: string }> };

export const DELETE = withAuth(async (session, _req: Request, ctx: Params) => {
  const { id, messageId } = await ctx.params;
  const db = getDb();

  // Ensure the conversation belongs to the organization
  const conversation = await db.query.conversation.findFirst({
    where: scoped(
      schema.conversation.organizationId,
      session.organizationId,
      eq(schema.conversation.id, id)
    )
  });

  if (!conversation) {
    return apiError(404, "not_found", "Conversación no encontrada");
  }

  const deleted = await db
    .delete(schema.message)
    .where(
      and(
        eq(schema.message.id, messageId),
        eq(schema.message.conversationId, id)
      )
    )
    .returning();

  if (!deleted[0]) {
    return apiError(404, "not_found", "Mensaje no encontrado");
  }

  return Response.json({ success: true });
});

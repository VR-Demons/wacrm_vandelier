import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export const DELETE = withAuth(async (session, _req: Request) => {
  const db = getDb();

  await db
    .delete(schema.contact)
    .where(eq(schema.contact.organizationId, session.organizationId));

  return Response.json({ success: true });
});

import { requireSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { organization, apiKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DeveloperSettingsClient } from "./client";

export const metadata = {
  title: "Desarrollador | Settings",
};

export default async function DeveloperSettingsPage() {
  const session = await requireSession();
  const db = getDb();

  const [org] = await db
    .select({ outboxDelayLimit: organization.outboxDelayLimit })
    .from(organization)
    .where(eq(organization.id, session.organizationId));

  const [key] = await db
    .select({ prefix: apiKey.prefix })
    .from(apiKey)
    .where(eq(apiKey.organizationId, session.organizationId));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Desarrollador</h1>
        <p className="text-muted-foreground mt-2">
          Administra las credenciales de la API pública y el comportamiento de los envíos automáticos.
        </p>
      </div>
      <DeveloperSettingsClient
        initialDelay={org?.outboxDelayLimit ?? 1000}
        initialPrefix={key?.prefix ?? null}
        organizationId={session.organizationId}
      />
    </div>
  );
}

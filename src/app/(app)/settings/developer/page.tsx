import { requireSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { organization, apiKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DeveloperSettingsClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Desarrollador | Settings",
};

export default async function DeveloperSettingsPage() {
  const session = await requireSession();
  const db = getDb();

  let outboxDelayLimit = 1000;
  let initialPrefix: string | null = null;

  try {
    const [org] = await db
      .select({ outboxDelayLimit: organization.outboxDelayLimit })
      .from(organization)
      .where(eq(organization.id, session.organizationId));
    if (org?.outboxDelayLimit !== undefined) {
      outboxDelayLimit = org.outboxDelayLimit;
    }
  } catch (err) {
    console.error("[settings/developer] Error loading organization settings:", err);
  }

  try {
    const [key] = await db
      .select({ prefix: apiKey.prefix })
      .from(apiKey)
      .where(eq(apiKey.organizationId, session.organizationId));
    if (key?.prefix) {
      initialPrefix = key.prefix;
    }
  } catch (err) {
    console.error("[settings/developer] Error loading api key:", err);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Desarrollador</h1>
        <p className="text-muted-foreground mt-2">
          Administra las credenciales de la API pública y el comportamiento de los envíos automáticos.
        </p>
      </div>
      <DeveloperSettingsClient
        initialDelay={outboxDelayLimit}
        initialPrefix={initialPrefix}
        organizationId={session.organizationId}
      />
    </div>
  );
}

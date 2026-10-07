import { TemplatesClient } from "@/components/settings/templates-client";
import { TemplateImageCard } from "@/components/settings/template-image-card";
import { getSessionOrNull } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TemplatesSettingsPage() {
  const session = await getSessionOrNull();
  let logo: string | null = null;
  
  if (session?.organizationId) {
    const db = getDb();
    const rows = await db
      .select({ logo: schema.organization.logo })
      .from(schema.organization)
      .where(eq(schema.organization.id, session.organizationId))
      .limit(1);
    logo = rows[0]?.logo || null;
  }

  return (
    <div className="space-y-6">
      <TemplateImageCard initialLogo={logo} />
      <TemplatesClient />
    </div>
  );
}

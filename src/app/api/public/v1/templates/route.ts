import { NextResponse } from "next/server";
import { getDb, schema } from "../../../../../lib/db";
import { eq, desc } from "drizzle-orm";
import { requirePublicApiKey } from "../../../../../lib/auth/public-api";
import { extractAllVariables } from "../../../../../lib/templates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { organizationId, error } = await requirePublicApiKey(req);
  if (error || !organizationId) {
    return error;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.template)
    .where(eq(schema.template.organizationId, organizationId))
    .orderBy(desc(schema.template.createdAt));

  const templates = rows.map((t) => {
    const requiredVariables = extractAllVariables(t.body);
    const variablesMap = (t.variablesMap as Record<string, string> | null) ?? {};

    // Generate a sample variables object for developer convenience
    const sampleVariables: Record<string, string> = {};
    for (const v of requiredVariables) {
      const label = variablesMap[`body_${v}`] || variablesMap[v] || `Valor para {{${v}}}`;
      sampleVariables[v] = `[${label}]`;
    }

    return {
      id: t.id,
      name: t.name,
      language: t.language,
      category: t.category,
      status: t.status,
      body: t.body,
      header: t.header,
      footer: t.footer,
      buttons: t.buttons,
      requiredVariables,
      variablesMap,
      examplePayload: {
        phone: "+5215512345678",
        template: t.name,
        language: t.language,
        variables: sampleVariables,
        immediate: true,
      },
    };
  });

  return NextResponse.json({
    success: true,
    count: templates.length,
    templates,
  });
}

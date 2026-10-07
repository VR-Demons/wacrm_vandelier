import { z } from "zod";
import { apiError, parseBody } from "@/lib/api";
import { getSessionOrNull } from "@/lib/auth/session";
import { resolveInstanceOrg } from "@/server/bot/auth";
import {
  getFoliosForContact,
  serializeFolioSummary,
  upsertContactFolios,
  type IngestFolioInput,
} from "@/server/folios";

export const dynamic = "force-dynamic";

async function getAuthContext(req: Request): Promise<{ organizationId: string } | null> {
  const apiKey = req.headers.get("x-api-key");
  const validKeys = [
    process.env.COBRANZA_API_KEY,
    process.env.BOT_API_KEY,
  ].filter(Boolean) as string[];

  if (apiKey && validKeys.includes(apiKey)) {
    const orgId = await resolveInstanceOrg();
    if (orgId) return { organizationId: orgId };
  }

  const session = await getSessionOrNull();
  if (session) return { organizationId: session.organizationId };

  return null;
}

const folioItemSchema = z
  .object({
    Folio: z.coerce.number().int().optional(),
    folio: z.coerce.number().int().optional(),
    Cliente: z.string().nullable().optional(),
    cliente: z.string().nullable().optional(),
    FechaExigibilidad: z.union([z.string(), z.date()]).nullable().optional(),
    fechaExigibilidad: z.union([z.string(), z.date()]).nullable().optional(),
    Producto: z.string().nullable().optional(),
    producto: z.string().nullable().optional(),
    Total: z.union([z.number(), z.string()]).nullable().optional(),
    total: z.union([z.number(), z.string()]).nullable().optional(),
    Pagado: z.boolean().nullable().optional(),
    pagado: z.boolean().nullable().optional(),
    Mora: z.union([z.number(), z.string()]).nullable().optional(),
    mora: z.union([z.number(), z.string()]).nullable().optional(),
    Telefono: z.union([z.string(), z.number()]).optional(),
    telefono: z.union([z.string(), z.number()]).optional(),
    phone: z.union([z.string(), z.number()]).optional(),
    Correo: z.string().nullable().optional(),
    correo: z.string().nullable().optional(),
    Contacto: z.string().nullable().optional(),
    contacto: z.string().nullable().optional(),
    RFC: z.string().nullable().optional(),
    rfc: z.string().nullable().optional(),
    Personalidad: z.string().nullable().optional(),
    personalidad: z.string().nullable().optional(),
    id: z.union([z.number(), z.string()]).nullable().optional(),
    externalId: z.union([z.number(), z.string()]).nullable().optional(),
  })
  .passthrough()
  .refine(
    (data) => data.Folio !== undefined || data.folio !== undefined,
    { message: "Folio es requerido" }
  );

const payloadSchema = z.union([
  folioItemSchema,
  z.array(folioItemSchema).min(1, "El arreglo no puede estar vacío"),
]);

export async function POST(req: Request) {
  const auth = await getAuthContext(req);
  if (!auth) return apiError(401, "unauthorized", "No autenticado");

  const parsed = await parseBody(req, payloadSchema);
  if (!parsed.ok) return parsed.response;

  const rawList = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const items = rawList as IngestFolioInput[];

  const upserted = await upsertContactFolios(auth.organizationId, items);

  return Response.json({
    success: true,
    count: upserted.length,
    folios: upserted.map(serializeFolioSummary),
  });
}

export async function GET(req: Request) {
  const auth = await getAuthContext(req);
  if (!auth) return apiError(401, "unauthorized", "No autenticado");

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contactId");
  if (!contactId) {
    return apiError(400, "bad_request", "Parámetro contactId es requerido");
  }

  const folios = await getFoliosForContact(auth.organizationId, contactId);
  return Response.json({
    folios: folios.map(serializeFolioSummary),
  });
}

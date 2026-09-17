import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import {
  deleteAllRecords,
  listRecords,
  updateRecord,
} from "@/server/cobranza/records";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza no está habilitada");
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const sort = url.searchParams.get("sort") || undefined;
  const dir = (url.searchParams.get("dir") as "asc" | "desc") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
  const status = url.searchParams.get("status") || undefined;
  const dateFilter = url.searchParams.get("date") || undefined;

  const results = await listRecords(session.organizationId, {
    search,
    sort,
    dir,
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: isNaN(pageSize) || pageSize < 1 ? 10 : pageSize,
    status,
    dateFilter,
  });

  return Response.json(results);
});

const updateSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().nullable().optional(),
  folio: z.string().optional(),
  clientName: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  rfc: z.string().nullable().optional(),
  personalidad: z.string().nullable().optional(),
  product: z.string().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  lateAmount: z.number().nullable().optional(),
  paid: z.boolean().optional(),
  status: z
    .enum(["active", "ya_pague", "wrong_number", "no_response", "resolved"])
    .optional(),
  lastContactedAt: z.coerce.date().nullable().optional(),
});

export const PATCH = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza no está habilitada");
  }

  const body = await parseBody(req, updateSchema);
  if (!body.ok) return body.response;

  const { id, ...fields } = body.data;

  const updated = await updateRecord(session.organizationId, id, fields);
  if (!updated) {
    return apiError(404, "not_found", "Registro no encontrado");
  }

  return Response.json({ record: updated });
});

const deleteSchema = z.object({
  confirm: z.literal("DELETE_ALL"),
});

export const DELETE = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza no está habilitada");
  }

  const body = await parseBody(req, deleteSchema);
  if (!body.ok) return body.response;

  const deletedCount = await deleteAllRecords(session.organizationId);

  return Response.json({ deletedCount });
});

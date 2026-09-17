import { apiError, withAuth } from "@/lib/api";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import { parseExcel } from "@/server/cobranza/upload-parser";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (session, req: Request) => {
  if (!cobranzaEnabled()) {
    return apiError(404, "not_found", "Cobranza no está habilitada");
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return apiError(400, "bad_request", "No se proporcionó archivo");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = parseExcel(buffer);

  return Response.json({
    productType: result.productType,
    records: result.records,
    recordCount: result.records.length,
    errors: result.errors,
  });
});

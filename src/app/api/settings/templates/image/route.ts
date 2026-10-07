import { rm } from "node:fs/promises";
import { apiError, withAuth } from "@/lib/api";
import {
  MAX_FAVICON_BYTES as MAX_IMAGE_BYTES,
  sniffFaviconMime as sniffImageMime,
} from "@/lib/favicon";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { mediaFilePath, saveMediaFile } from "@/server/whatsapp/media";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const TEMPLATE_IMAGE_ASSET = "template_image";

export const PUT = withAuth(async (session, req: Request) => {
  if (session.role !== "owner") {
    return apiError(403, "forbidden", "Solo el propietario puede cambiar la imagen");
  }

  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.byteLength === 0) {
    return apiError(422, "empty", "No llegó ningún archivo");
  }
  if (buf.byteLength > MAX_IMAGE_BYTES) {
    return apiError(
      413,
      "too_large",
      `La imagen no puede pasar de ${Math.round(MAX_IMAGE_BYTES / 1024)} KB`
    );
  }

  const mime = sniffImageMime(buf);
  if (!mime) {
    return apiError(
      422,
      "unsupported",
      "Formato no reconocido. Usa PNG, SVG, ICO, JPEG o WebP."
    );
  }

  await saveMediaFile(session.organizationId, TEMPLATE_IMAGE_ASSET, buf);

  // Construct absolute URL for Meta API
  const baseUrl = getEnv().APP_BASE_URL;
  const version = Date.now();
  const logoUrl = `${baseUrl}/api/branding/template-image?org=${session.organizationId}&v=${version}`;

  const db = getDb();
  await db
    .update(schema.organization)
    .set({ logo: logoUrl })
    .where(eq(schema.organization.id, session.organizationId));

  return Response.json({ logo: logoUrl });
});

export const DELETE = withAuth(async (session) => {
  if (session.role !== "owner") {
    return apiError(403, "forbidden", "Solo el propietario puede cambiar la imagen");
  }

  const db = getDb();
  await db
    .update(schema.organization)
    .set({ logo: null })
    .where(eq(schema.organization.id, session.organizationId));

  await rm(mediaFilePath(session.organizationId, TEMPLATE_IMAGE_ASSET), {
    force: true,
  }).catch(() => null);

  return Response.json({ logo: null });
});

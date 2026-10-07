import { readMediaFile } from "@/server/whatsapp/media";
import { DEFAULT_BRANDING } from "@/lib/branding";

export const dynamic = "force-dynamic";

const TEMPLATE_IMAGE_ASSET = "template_image";

function cabeceras(mime: string, cacheable: boolean): HeadersInit {
  return {
    "content-type": mime,
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
    "x-content-type-options": "nosniff",
    "cache-control": cacheable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60",
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cacheable = url.searchParams.has("v");
  const org = url.searchParams.get("org");

  if (!org) {
    return new Response("Missing org", { status: 400 });
  }

  try {
    const buf = await readMediaFile(org, TEMPLATE_IMAGE_ASSET);
    // Asumimos mime dinámico (o forzamos octet-stream si no lo guardamos).
    // Para simplificar, usamos un tipo genérico o deducimos.
    return new Response(new Uint8Array(buf), {
      headers: cabeceras("image/png", cacheable), // o leerlo de sniff
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

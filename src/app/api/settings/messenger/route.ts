import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { graphRequest, MetaApiError } from "@/lib/meta/client";
import {
  getMessengerCredentialsByOrg,
  saveMessengerCredentials,
  tokenLast4,
} from "@/server/messenger/credentials";
import {
  channelDisabledResponse,
  isChannelEnabled,
} from "@/server/channels/enabled";

export const dynamic = "force-dynamic";

/** 017 — Estado de la conexión de Messenger (el token nunca sale entero). */
export const GET = withAuth(async (session) => {
  if (!isChannelEnabled("messenger")) return channelDisabledResponse();
  const creds = await getMessengerCredentialsByOrg(session.organizationId);
  if (!creds) return Response.json({ connection: null });
  return Response.json({
    connection: {
      pageId: creds.pageId,
      pageName: creds.pageName,
      status: creds.status,
      tokenLast4: tokenLast4(creds.token),
    },
  });
});

const putSchema = z.object({
  pageId: z.string().trim().min(1),
  token: z.string().trim().min(1),
});

/**
 * Guarda la conexión validando ANTES contra Meta, igual que el wizard de
 * WhatsApp: un token que no sirve no llega a la base. Solo el propietario
 * de la organización puede hacerlo.
 */
export const PUT = withAuth(async (session, req: Request) => {
  if (!isChannelEnabled("messenger")) return channelDisabledResponse();
  if (session.role !== "owner") {
    return apiError(403, "forbidden", "Solo el propietario puede conectar la página");
  }
  const body = await parseBody(req, putSchema);
  if (!body.ok) return body.response;
  const data = body.data;

  const check = await verify(data.pageId, data.token);
  if (!check.ok) return apiError(check.status, check.code, check.message);

  await saveMessengerCredentials({
    organizationId: session.organizationId,
    pageId: data.pageId,
    pageName: check.pageName,
    token: data.token,
  });

  return Response.json({ ok: true, pageName: check.pageName });
});

type Check =
  | { ok: true; pageName: string | null }
  | { ok: false; status: number; code: string; message: string };

/**
 * El token debe ser de ESA página: se le pregunta a Graph quién es y se
 * compara el id. Un token de otra página guardaría credenciales que reciben
 * webhooks de una y contestan por otra.
 */
async function verify(pageId: string, token: string): Promise<Check> {
  try {
    const res = await graphRequest<{ id?: string; name?: string }>(
      `${pageId}?fields=id,name`,
      { token }
    );
    if (res.id && res.id !== pageId) {
      return {
        ok: false,
        status: 422,
        code: "id_mismatch",
        message: `El token pertenece a la página ${res.id}, no a ${pageId}`,
      };
    }
    return { ok: true, pageName: res.name?.trim() || null };
  } catch (err) {
    if (err instanceof MetaApiError) {
      if (err.status === 0 || err.status >= 500) {
        return {
          ok: false,
          status: 503,
          code: "platform_unavailable",
          message: "No se pudo contactar a Meta; intenta de nuevo",
        };
      }
      return {
        ok: false,
        status: 422,
        code: "invalid_token",
        message:
          "El token de la página no es válido o no tiene permiso de mensajes (pages_messaging)",
      };
    }
    throw err;
  }
}

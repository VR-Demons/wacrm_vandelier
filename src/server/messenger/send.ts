import { graphRequest, MetaApiError } from "@/lib/meta/client";
import type { MessengerCredentials } from "@/server/messenger/credentials";

/**
 * 017 — Frontera de salida del canal de Messenger (Constitución II: todo
 * request a una plataforma pasa por un único módulo).
 *
 * Messenger habla por `graph.facebook.com`, el MISMO host que WhatsApp, así
 * que reutiliza el cliente de Graph que ya existe (`graphRequest`): misma
 * versión de API, mismo `META_GRAPH_BASE_URL` (y por tanto el mismo mock en
 * pruebas) y los mismos errores tipados que el resto del CRM ya interpreta.
 */

export type MessengerSendResult = { platformMessageId: string };

/**
 * Cuerpo del envío. Separado para poder afirmarlo en una prueba sin red: la
 * etiqueta de agente humano es lo único que distingue un envío dentro de la
 * ventana de uno fuera, y equivocarla no da error de compilación — da un 400
 * de Meta en producción a las 2 de la mañana.
 */
export function buildMessengerSendBody(input: {
  recipient: string;
  text: string;
  humanAgentTag: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    recipient: { id: input.recipient },
    message: { text: input.text },
    // RESPONSE dentro de la ventana estándar de 24 h. Fuera, Messenger no
    // tiene plantillas: la única vía es la etiqueta HUMAN_AGENT (7 días).
    messaging_type: input.humanAgentTag ? "MESSAGE_TAG" : "RESPONSE",
  };
  if (input.humanAgentTag) body.tag = "HUMAN_AGENT";
  return body;
}

/**
 * Envía texto a un PSID (`recipient` viene ya sin el prefijo `fb:`).
 *
 * Meta responde `{ recipient_id, message_id }`; el mock de Graph del entorno
 * de pruebas responde con la forma de WhatsApp (`messages[0].id`), y se
 * aceptan las dos para que el mismo código sirva en ambos.
 */
export async function sendMessengerText(input: {
  credentials: MessengerCredentials;
  recipient: string;
  text: string;
  humanAgentTag?: boolean;
}): Promise<MessengerSendResult> {
  const res = await graphRequest<{
    message_id?: string;
    messages?: { id: string }[];
  }>(`${input.credentials.pageId}/messages`, {
    method: "POST",
    token: input.credentials.token,
    body: buildMessengerSendBody({
      recipient: input.recipient,
      text: input.text,
      humanAgentTag: input.humanAgentTag ?? false,
    }),
  });
  const id = res.message_id ?? res.messages?.[0]?.id;
  if (!id) {
    throw new MetaApiError("Meta no devolvió ID de mensaje", { status: 502 });
  }
  return { platformMessageId: String(id) };
}

/**
 * Nombre visible de quien escribe. El webhook de Messenger no trae nombre ni
 * usuario —solo el PSID—, y un contacto llamado "8371…" en la bandeja es
 * inservible para el operador. Se consulta al perfil con el token de la
 * página; si Meta no lo da (permiso ausente, perfil restringido) se devuelve
 * null y la ingesta cae al nombre de respaldo: nunca se bloquea un mensaje
 * por un nombre.
 */
export async function fetchMessengerProfileName(
  credentials: MessengerCredentials,
  psid: string
): Promise<string | null> {
  try {
    const res = await graphRequest<{
      first_name?: string;
      last_name?: string;
      name?: string;
    }>(`${psid}?fields=first_name,last_name`, { token: credentials.token });
    const full = [res.first_name, res.last_name]
      .filter((part): part is string => typeof part === "string" && part.trim() !== "")
      .join(" ")
      .trim();
    return full || res.name?.trim() || null;
  } catch {
    return null;
  }
}

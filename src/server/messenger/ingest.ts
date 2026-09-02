import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { FB_PREFIX } from "@/server/inbox/identity";
import { ingestInboundMessage } from "@/server/inbox/ingest";
import { getMessengerCredentialsByPageId } from "@/server/messenger/credentials";
import { fetchMessengerProfileName } from "@/server/messenger/send";

/**
 * 017 — Adaptador de entrada del canal de Messenger.
 *
 * Meta manda los mensajes de la página con `object: "page"` y la misma forma
 * `entry[].messaging[]` que usa para Instagram. Aquí se normaliza a la forma
 * interna y de ahí en adelante corre el MISMO núcleo de ingesta que ya
 * resuelve contacto, conversación, idempotencia y bus de eventos (SSE).
 *
 * El normalizador es una función pura para poder probarla sin base de datos:
 * qué se ingiere y qué se descarta (echos, acuses, postbacks) es la parte que
 * más fácil se rompe cuando Meta cambia un campo.
 */

/** Un mensaje entrante ya en la forma que entiende el núcleo. */
export type MessengerInbound = {
  pageId: string;
  /** Page-Scoped ID del remitente: la identidad del contacto (`fb:<PSID>`). */
  psid: string;
  mid: string;
  text: string | null;
  /** Tipo para la bandeja: text | image | video | audio | document | sticker | unsupported */
  type: string;
  /** Segundos desde epoch, como lo consume el núcleo. */
  timestamp: string;
};

type MessengerPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
        attachments?: Array<{
          type?: string;
          payload?: { url?: string; sticker_id?: number };
        }>;
      };
      postback?: unknown;
      delivery?: unknown;
      read?: unknown;
    }>;
  }>;
};

/**
 * Tipos de adjunto de Messenger → tipo de mensaje del CRM. En la v1 el
 * adjunto no se descarga (Messenger lo entrega como URL temporal, no como id
 * de media): el mensaje entra con su tipo para que la bandeja enseñe
 * "📎 Imagen" en vez de perder el mensaje, y el operador sepa que hay algo
 * que ver en la app de la página.
 */
const ATTACHMENT_TYPE: Record<string, string> = {
  image: "image",
  video: "video",
  audio: "audio",
  file: "document",
};

export function normalizeMessengerPayload(payload: unknown): MessengerInbound[] {
  const body = payload as MessengerPayload | null;
  if (!body || body.object !== "page") return [];

  const out: MessengerInbound[] = [];
  for (const entry of body.entry ?? []) {
    const pageId = entry.id;
    if (!pageId) continue;

    for (const m of entry.messaging ?? []) {
      const msg = m.message;
      // Acuses de entrega/lectura y postbacks no son mensajes: nada que
      // enseñar en la bandeja.
      if (!msg) continue;
      // Los echos son lo que la página mandó desde su propia bandeja de
      // Facebook. Fuera del alcance de la v1: se ignoran sin ruido.
      if (msg.is_echo) continue;

      const psid = m.sender?.id;
      const mid = msg.mid;
      if (!psid || !mid) continue;

      const text =
        typeof msg.text === "string" && msg.text.length > 0 ? msg.text : null;
      const attachment = msg.attachments?.[0];
      let type: string | null = text ? "text" : null;
      if (!type && attachment) {
        type = attachment.payload?.sticker_id
          ? "sticker"
          : (ATTACHMENT_TYPE[attachment.type ?? ""] ?? "unsupported");
      }
      if (!type) continue; // ni texto ni adjunto: no hay nada que ingerir

      const seconds = m.timestamp
        ? Math.floor(m.timestamp / 1000)
        : Math.floor(Date.now() / 1000);

      out.push({ pageId, psid, mid, text, type, timestamp: String(seconds) });
    }
  }
  return out;
}

async function contactExists(
  organizationId: string,
  identity: string
): Promise<boolean> {
  const rows = await getDb()
    .select({ id: schema.contact.id })
    .from(schema.contact)
    .where(
      and(
        eq(schema.contact.organizationId, organizationId),
        eq(schema.contact.channel, "messenger"),
        eq(schema.contact.waIdentity, identity)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function processMessengerPayload(payload: unknown): Promise<void> {
  for (const evt of normalizeMessengerPayload(payload)) {
    const creds = await getMessengerCredentialsByPageId(evt.pageId);
    if (!creds) {
      console.warn(
        `[messenger] evento para una página desconocida (${evt.pageId}): ` +
          "guarda la conexión en Configuración → Messenger para recibir mensajes"
      );
      continue;
    }

    const identity = `${FB_PREFIX}${evt.psid}`;
    // El nombre se consulta UNA vez, la primera que se ve al PSID: después el
    // contacto ya existe y el nombre que tenga (o el que editó el operador)
    // manda. Consultarlo en cada mensaje sería un viaje a Meta por renglón.
    const profileName = (await contactExists(creds.organizationId, identity))
      ? null
      : await fetchMessengerProfileName(creds, evt.psid);

    await ingestInboundMessage({
      organizationId: creds.organizationId,
      identity: {
        identity,
        channel: "messenger",
        phone: null,
        waUserId: null,
        profileName,
      },
      // Prefijado para que no colisione jamás con un id de WhatsApp ni de
      // Instagram en el índice único de mensajes.
      waMessageId: `fb_${evt.mid}`,
      type: evt.type,
      text: evt.text,
      timestamp: evt.timestamp,
      threadRef: null,
    });
  }
}

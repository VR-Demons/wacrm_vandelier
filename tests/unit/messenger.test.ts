import { describe, expect, it } from "vitest";
import { CHANNEL_LABEL, CHANNEL_ORDER, isChannel } from "@/lib/channels";
import { FB_PREFIX, IG_PREFIX, BSUID_PREFIX } from "@/server/inbox/identity";
import { capabilitiesFor, textFits, windowClosedMessage } from "@/server/channels/capabilities";
import { parseChannels } from "@/server/channels/enabled";
import { channelMark } from "@/components/channel-badge";
import { normalizeMessengerPayload } from "@/server/messenger/ingest";
import { buildMessengerSendBody } from "@/server/messenger/send";

const PAGE = "1092837465";
const PSID = "83719264018";

/** Un webhook de Meta con lo que trae de verdad: `object: "page"`. */
function webhook(messaging: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    object: "page",
    entry: [{ id: PAGE, time: 1_770_000_000_000, messaging }],
    ...overrides,
  };
}

describe("017 · Messenger en el catálogo de canales", () => {
  it("existe, se enciende con CHANNELS y tiene nombre y distintivo", () => {
    expect(isChannel("messenger")).toBe(true);
    expect(CHANNEL_ORDER).toContain("messenger");
    expect(CHANNEL_LABEL.messenger).toBe("Messenger");
    expect(parseChannels("whatsapp,messenger").has("messenger")).toBe(true);
    expect(parseChannels("instagram").has("messenger")).toBe(false);
    expect(channelMark("messenger")).not.toBeNull();
  });

  it("capacidades: 24 h con etiqueta fuera de ventana, sin plantillas ni adjuntos salientes", () => {
    const caps = capabilitiesFor("messenger");
    expect(caps.windowMs).toBe(24 * 60 * 60 * 1000);
    expect(caps.outsideWindow).toBe("human_agent_tag");
    expect(caps.outboundMedia).toBe(false);
    expect(caps.deliveryReceipts).toBe(false);
    // Fuera de ventana no se le pide nada al operador: sale etiquetado solo.
    expect(windowClosedMessage("messenger")).toBe("");
  });

  it("el límite de texto es de 2000 y se cuenta en BYTES", () => {
    expect(textFits("messenger", "a".repeat(2000))).toBe(true);
    expect(textFits("messenger", "a".repeat(2001))).toBe(false);
    // 1200 acentos = 2400 bytes: contando caracteres pasaría y Meta lo rechazaría.
    expect(textFits("messenger", "é".repeat(1200))).toBe(false);
  });

  it("la identidad lleva su propio prefijo: nunca colisiona con WhatsApp ni Instagram", () => {
    expect(FB_PREFIX).toBe("fb:");
    expect(new Set([FB_PREFIX, IG_PREFIX, BSUID_PREFIX]).size).toBe(3);
  });
});

describe("017 · normalizeMessengerPayload (qué entra y qué se descarta)", () => {
  it("un texto entra con su página, su PSID, su mid y su hora en segundos", () => {
    const [evt, ...rest] = normalizeMessengerPayload(
      webhook([
        {
          sender: { id: PSID },
          recipient: { id: PAGE },
          timestamp: 1_770_000_123_456,
          message: { mid: "m_abc", text: "Hola, ¿tienen envíos?" },
        },
      ])
    );
    expect(rest).toHaveLength(0);
    expect(evt).toEqual({
      pageId: PAGE,
      psid: PSID,
      mid: "m_abc",
      text: "Hola, ¿tienen envíos?",
      type: "text",
      timestamp: "1770000123",
    });
  });

  it("un adjunto sin texto entra con su tipo para que la bandeja enseñe qué llegó", () => {
    const [img] = normalizeMessengerPayload(
      webhook([
        {
          sender: { id: PSID },
          message: {
            mid: "m_img",
            attachments: [{ type: "image", payload: { url: "https://cdn/x.jpg" } }],
          },
        },
      ])
    );
    expect(img?.type).toBe("image");
    expect(img?.text).toBeNull();

    const [doc] = normalizeMessengerPayload(
      webhook([{ sender: { id: PSID }, message: { mid: "m_doc", attachments: [{ type: "file" }] } }])
    );
    expect(doc?.type).toBe("document");

    const [sticker] = normalizeMessengerPayload(
      webhook([
        {
          sender: { id: PSID },
          message: { mid: "m_stk", attachments: [{ type: "image", payload: { sticker_id: 369239 } }] },
        },
      ])
    );
    expect(sticker?.type).toBe("sticker");
  });

  it("los echos (lo que mandó la página), los acuses y los postbacks NO son mensajes", () => {
    const events = normalizeMessengerPayload(
      webhook([
        { sender: { id: PAGE }, recipient: { id: PSID }, message: { mid: "m_echo", text: "Gracias", is_echo: true } },
        { sender: { id: PSID }, delivery: { mids: ["m_1"], watermark: 1 } },
        { sender: { id: PSID }, read: { watermark: 1 } },
        { sender: { id: PSID }, postback: { title: "Empezar", payload: "GET_STARTED" } },
      ])
    );
    expect(events).toEqual([]);
  });

  it("lo que no es un webhook de página se ignora entero", () => {
    expect(normalizeMessengerPayload(webhook([{ sender: { id: PSID }, message: { mid: "m", text: "x" } }], { object: "instagram" }))).toEqual([]);
    expect(normalizeMessengerPayload(null)).toEqual([]);
    expect(normalizeMessengerPayload("basura")).toEqual([]);
    expect(normalizeMessengerPayload({ object: "page" })).toEqual([]);
  });

  it("sin remitente o sin mid no hay con qué identificar ni deduplicar: se descarta", () => {
    expect(
      normalizeMessengerPayload(webhook([{ message: { mid: "m", text: "x" } }, { sender: { id: PSID }, message: { text: "x" } }]))
    ).toEqual([]);
  });

  it("varias entradas y varios mensajes se aplanan en orden", () => {
    const events = normalizeMessengerPayload({
      object: "page",
      entry: [
        { id: PAGE, messaging: [{ sender: { id: "a" }, message: { mid: "1", text: "uno" } }] },
        { id: "otra-pagina", messaging: [{ sender: { id: "b" }, message: { mid: "2", text: "dos" } }] },
      ],
    });
    expect(events.map((e) => `${e.pageId}/${e.psid}/${e.mid}`)).toEqual([`${PAGE}/a/1`, "otra-pagina/b/2"]);
  });
});

describe("017 · buildMessengerSendBody", () => {
  it("dentro de la ventana es una RESPONSE normal", () => {
    expect(buildMessengerSendBody({ recipient: PSID, text: "Sí, a toda la ciudad", humanAgentTag: false })).toEqual({
      recipient: { id: PSID },
      message: { text: "Sí, a toda la ciudad" },
      messaging_type: "RESPONSE",
    });
  });

  it("fuera de la ventana sale etiquetado como agente humano", () => {
    const body = buildMessengerSendBody({ recipient: PSID, text: "Ya te contesto", humanAgentTag: true });
    expect(body.messaging_type).toBe("MESSAGE_TAG");
    expect(body.tag).toBe("HUMAN_AGENT");
  });
});

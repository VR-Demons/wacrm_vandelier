/**
 * Self-test E2E de comportamiento — 017: canal de Messenger.
 *
 * Conduce la app real en localhost con el mock de Graph: conecta una página,
 * mete mensajes por el webhook como lo haría Meta y responde desde la bandeja,
 * comprobando cada paso por las mismas superficies que usa el operador.
 *
 * Uso:
 *   1) app corriendo con WA_MOCK_ENABLED=true, META_GRAPH_BASE_URL → wa-mock,
 *      CHANNELS incluyendo messenger, y BD migrada
 *   2) node --env-file=.env scripts/e2e-messenger.mjs
 *
 * Sale con código 1 si algún check falla.
 */

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
const PAGE = "page-demo-001";
const PSID = `psid-${Date.now()}`;

let cookie = "";
let failures = 0;
let checks = 0;

function ok(name, cond, extra = "") {
  checks++;
  if (cond) console.log(`  OK  ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      origin: BASE,
      ...(cookie ? { cookie } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  let json = null;
  try {
    json = await res.clone().json();
  } catch {}
  return { res, json };
}

/** Meta entrega por POST sin cookies; la ruta lleva el segmento secreto. */
async function webhook(payload, token = VERIFY_TOKEN) {
  return fetch(`${BASE}/api/webhooks/messenger/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function pageEvent(messaging) {
  return { object: "page", entry: [{ id: PAGE, time: Date.now(), messaging }] };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** La ingesta corre tras responder el webhook: se espera a que aparezca. */
async function waitForConversation(pred, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const { json } = await api("/api/conversations");
    const found = (json?.conversations ?? []).find(pred);
    if (found) return found;
    await sleep(300);
  }
  return null;
}

async function main() {
  if (!VERIFY_TOKEN) {
    console.error("Falta META_WEBHOOK_VERIFY_TOKEN en el entorno");
    process.exit(1);
  }

  console.log("== Setup: registro/login del propietario ==");
  const email = "e2e@vocero.test";
  const password = "password-e2e-123";
  let su = await api("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name: "Operador E2E" }),
  });
  if (!su.res.ok) {
    su = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }
  ok("registro o login del propietario", su.res.ok);

  console.log("\n== Conexión de la página (validada contra Graph) ==");
  const bad = await api("/api/settings/messenger", {
    method: "PUT",
    body: JSON.stringify({ pageId: PAGE, token: "token-invalid" }),
  });
  ok("un token que Meta rechaza NO se guarda → 422", bad.res.status === 422, String(bad.res.status));

  const conn = await api("/api/settings/messenger", {
    method: "PUT",
    body: JSON.stringify({ pageId: PAGE, token: "token-pagina-demo" }),
  });
  ok("PUT con token válido → 200 con el nombre de la página", conn.res.ok && conn.json?.pageName === "Página de prueba Vocero", JSON.stringify(conn.json));

  const state = await api("/api/settings/messenger");
  ok(
    "GET enseña la conexión sin el token entero (solo su cola)",
    state.json?.connection?.status === "connected" &&
      state.json?.connection?.tokenLast4 === "demo" &&
      !JSON.stringify(state.json).includes("token-pagina-demo")
  );

  const wh = await api("/api/settings/webhook");
  ok(
    "la pantalla tiene la URL del webhook de Messenger con el segmento secreto",
    typeof wh.json?.messengerUrl === "string" && wh.json.messengerUrl.endsWith(`/api/webhooks/messenger/${VERIFY_TOKEN}`)
  );

  console.log("\n== Webhook: capas de seguridad ==");
  const wrong = await webhook(pageEvent([]), "token-equivocado");
  ok("segmento secreto equivocado → 404 sin efectos", wrong.status === 404, String(wrong.status));
  const hs = await fetch(
    `${BASE}/api/webhooks/messenger/${VERIFY_TOKEN}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=reto-123`
  );
  ok("handshake de Meta devuelve el challenge", hs.status === 200 && (await hs.text()) === "reto-123");

  console.log("\n== Entrante: un texto crea contacto y conversación con su canal ==");
  const first = await webhook(
    pageEvent([
      {
        sender: { id: PSID },
        recipient: { id: PAGE },
        timestamp: Date.now(),
        message: { mid: `m_${PSID}_1`, text: "Hola, ¿tienen envíos a Guadalajara?" },
      },
    ])
  );
  ok("Meta recibe 200 de inmediato", first.status === 200);
  const conv = await waitForConversation((c) => c.contact?.name === "Cliente de Messenger" || c.preview?.includes("Guadalajara"));
  ok("la conversación aparece en la bandeja", Boolean(conv));
  ok("con canal messenger", conv?.channel === "messenger", conv?.channel);
  ok("el contacto tiene nombre de perfil, no el PSID crudo", conv?.contact?.name === "Cliente de Messenger", conv?.contact?.name);
  ok("el contacto no tiene teléfono (Messenger no lo da)", conv?.contact?.phone == null);
  ok("la ventana de 24 h abre con el entrante", conv?.windowOpen === true);

  console.log("\n== Idempotencia y ruido ==");
  await webhook(
    pageEvent([{ sender: { id: PSID }, message: { mid: `m_${PSID}_1`, text: "Hola, ¿tienen envíos a Guadalajara?" } }])
  );
  await webhook(
    pageEvent([
      { sender: { id: PAGE }, recipient: { id: PSID }, message: { mid: `m_${PSID}_echo`, text: "eco", is_echo: true } },
      { sender: { id: PSID }, delivery: { mids: [`m_${PSID}_1`], watermark: Date.now() } },
      { sender: { id: PSID }, read: { watermark: Date.now() } },
    ])
  );
  await webhook(
    pageEvent([
      { sender: { id: PSID }, message: { mid: `m_${PSID}_img`, attachments: [{ type: "image", payload: { url: "https://cdn.example/x.jpg" } }] } },
    ])
  );
  await sleep(1200);
  const msgs = await api(`/api/conversations/${conv?.id}/messages`);
  const inbound = (msgs.json?.messages ?? []).filter((m) => m.direction === "in");
  ok("el webhook repetido NO duplica el mensaje", inbound.filter((m) => m.text?.includes("Guadalajara")).length === 1, `in=${inbound.length}`);
  ok("echo, acuses y lectura no crean mensajes", inbound.every((m) => m.text !== "eco"));
  ok("un adjunto entra con su tipo (imagen) para que se vea que llegó", inbound.some((m) => m.type === "image"), inbound.map((m) => m.type).join(","));
  const all = await api("/api/conversations");
  ok("sigue habiendo UNA conversación para ese PSID", (all.json?.conversations ?? []).filter((c) => c.contact?.name === "Cliente de Messenger" && c.id === conv?.id).length === 1);

  console.log("\n== Salida: responder desde la bandeja llega a la página ==");
  const before = await fetch(`${BASE}/api/dev/wa-mock/outbox`).then((r) => r.json());
  const reply = await api(`/api/conversations/${conv?.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "Sí, a toda la zona metropolitana. ¿Qué necesitas?" }),
  });
  ok("POST /messages → 200/201", reply.res.ok, JSON.stringify(reply.json));
  const after = await fetch(`${BASE}/api/dev/wa-mock/outbox`).then((r) => r.json());
  const sent = (after.outbox ?? after ?? []).slice((before.outbox ?? before ?? []).length);
  const last = Array.isArray(sent) ? sent[sent.length - 1] : null;
  ok("salió por la página (POST /{pageId}/messages), no por el número de WhatsApp", last?.phoneNumberId === PAGE, JSON.stringify(last));
  ok("al PSID correcto y como RESPONSE dentro de la ventana", last?.body?.recipient?.id === PSID && last?.body?.messaging_type === "RESPONSE");
  const msgs2 = await api(`/api/conversations/${conv?.id}/messages`);
  const out = (msgs2.json?.messages ?? []).find((m) => m.direction === "out");
  ok("el saliente queda en el hilo como 'sent' (Messenger no manda acuses)", out?.status === "sent", out?.status);

  console.log("\n== Lo que Messenger no admite falla claro ==");
  const loc = await api(`/api/conversations/${conv?.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ type: "location", location: { latitude: 20.67, longitude: -103.35 } }),
  });
  ok("una ubicación por Messenger → error claro, no 500", loc.res.status >= 400 && loc.res.status < 500, String(loc.res.status));
  const long = await api(`/api/conversations/${conv?.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "x".repeat(2001) }),
  });
  ok("un texto de más de 2000 bytes → rechazado antes de tocar Meta", long.res.status >= 400 && long.res.status < 500, String(long.res.status));

  console.log(`\n===== ${checks - failures}/${checks} checks OK, ${failures} fallos =====`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error("ERROR FATAL:", err);
  process.exit(1);
});

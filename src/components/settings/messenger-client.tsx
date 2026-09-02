"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 017 — Conexión de la página de Facebook para la bandeja de Messenger.
 *
 * Misma forma que el wizard de WhatsApp: se prueba contra Meta ANTES de
 * guardar, el token se cifra y hacia fuera solo se enseña su cola. Y la
 * misma regla que Instagram: la pantalla solo existe si el canal está
 * encendido con `CHANNELS` (ADR-001).
 */

type Connection = {
  pageId: string;
  pageName: string | null;
  status: "connected" | "reconnect_required";
  tokenLast4: string;
};

type WebhookInfo = {
  messengerUrl: string | null;
  verifyToken: string;
  isHttps: boolean;
  signatureLayer: boolean;
};

export function MessengerClient() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [webhook, setWebhook] = useState<WebhookInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pageId, setPageId] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "token" | null>(null);

  const refetch = useCallback(async () => {
    const [c, w] = await Promise.all([
      fetch("/api/settings/messenger").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/settings/webhook").then((r) => (r.ok ? r.json() : null)),
    ]).catch(() => [null, null]);
    if (c) {
      setConnection(c.connection);
      if (c.connection?.pageId) setPageId(c.connection.pageId);
    }
    if (w) setWebhook(w);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(null);
    const res = await fetch("/api/settings/messenger", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageId: pageId.trim(), token: token.trim() }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setError(data?.error?.message ?? "No se pudo conectar la página");
      return;
    }
    const data = (await res.json()) as { pageName?: string | null };
    setToken("");
    setSaved(
      data.pageName
        ? `Página conectada: ${data.pageName}`
        : "Página conectada"
    );
    void refetch();
  }

  async function copy(text: string, what: "url" | "token") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // sin portapapeles (contexto no seguro): el texto sigue visible para copiarlo a mano
    }
  }

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {connection?.status === "reconnect_required" && (
        <div className="flex items-start gap-2 rounded-lg border border-danger-soft bg-danger-tint p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-danger-text">
              El token de la página expiró o fue revocado.
            </p>
            <p className="text-danger-text opacity-80">
              Los envíos por Messenger están pausados. Pega un token nuevo abajo
              para reconectar.
            </p>
          </div>
        </div>
      )}

      {connection?.status === "connected" && (
        <div className="flex items-center gap-3 rounded-lg border border-success-soft bg-success-tint p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-success-text">
              Página conectada: {connection.pageName ?? connection.pageId}
            </p>
            <p className="text-success-text opacity-80">
              ID {connection.pageId} · token que termina en ····
              {connection.tokenLast4}
            </p>
          </div>
          <Badge variant="success">Messenger activo</Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {connection ? "Reconectar la página" : "Conectar la página de Facebook"}
          </CardTitle>
          <CardDescription>
            Los mensajes que la gente le escribe a tu página por Messenger
            entran a la misma bandeja que WhatsApp, con su distintivo de canal.
            Necesitas una app en developers.facebook.com con el producto
            Messenger y el permiso <code>pages_messaging</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-xs text-text-2">
            <li>
              El ID de la página está en la sección «Información» de la página,
              o en el panel de Messenger de tu app (Messenger → Configuración →
              Tokens de acceso).
            </li>
            <li>
              Genera ahí el token de la página. Uno de larga duración evita
              reconectar cada dos meses.
            </li>
            <li>
              Sin App Review, la página solo recibe mensajes de cuentas con un
              rol en la app (administradores, desarrolladores, testers). Para
              atender al público hay que aprobar <code>pages_messaging</code>.
            </li>
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fb-page-id">ID de la página</Label>
              <Input
                id="fb-page-id"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="1234567890"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-token">Token de acceso de la página</Label>
              <Input
                id="fb-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAAG…"
                autoComplete="off"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-success-text">{saved} ✓</p>}

          <Button
            disabled={saving || !pageId.trim() || !token.trim()}
            onClick={() => void save()}
          >
            {saving ? "Probando…" : "Probar y guardar"}
          </Button>
        </CardContent>
      </Card>

      {webhook?.messengerUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook de Messenger</CardTitle>
            <CardDescription>
              En tu app de Meta: Messenger → Configuración → Webhooks. Objeto{" "}
              <code>page</code>, campo <code>messages</code>. Pega esta URL y
              este token de verificación, y suscribe la página a la app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL de callback</Label>
              <div className="flex gap-2">
                <Input readOnly value={webhook.messengerUrl} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copiar la URL"
                  onClick={() => void copy(webhook.messengerUrl!, "url")}
                >
                  {copied === "url" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Token de verificación</Label>
              <div className="flex gap-2">
                <Input readOnly value={webhook.verifyToken} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copiar el token de verificación"
                  onClick={() => void copy(webhook.verifyToken, "token")}
                >
                  {copied === "token" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="flex items-start gap-2 text-xs text-text-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {webhook.signatureLayer
                ? "Cada entrega se verifica con la firma del App Secret de tu app."
                : "Define META_APP_SECRET en la instancia para que además se verifique la firma de cada entrega."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

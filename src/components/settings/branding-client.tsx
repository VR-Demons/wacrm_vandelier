"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  ACCENT_PRESETS,
  DEFAULT_BRANDING,
  isValidHex,
  resolveAccentSet,
  resolveNavAccentSet,
  type AccentSet,
  type Branding,
} from "@/lib/branding";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useResolvedTheme } from "@/components/use-theme";
import { BrandLogo } from "@/components/brand-mark";
import { navItemClass } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Los tokens del acento, para sobreescribirlos SOLO dentro de una caja. */
function accentVars(s: AccentSet): React.CSSProperties {
  return {
    "--accent": s.accent,
    "--accent-hover": s.hover,
    "--accent-soft": s.soft,
    "--accent-tint": s.tint,
    "--accent-text": s.text,
    "--accent-fg": s.fg,
  } as React.CSSProperties;
}

export function BrandingClient({
  favicon = null,
}: {
  /**
   * Logo subido, solo para la vista previa: se sube y se quita en su propia
   * tarjeta. Llega del servidor y no del fetch de abajo a propósito: esa
   * tarjeta hace `router.refresh()` al subir o quitar, la página vuelve a
   * pasar la prop y la vista previa cambia sin recargar. Leído una sola vez
   * al montar, se quedaría con el logo de antes.
   */
  favicon?: Branding["favicon"];
}) {
  const router = useRouter();
  const mode = useResolvedTheme();
  const [name, setName] = useState("");
  const [accent, setAccent] = useState<string>(DEFAULT_BRANDING.accent);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [wipingReq, setWipingReq] = useState(false);

  useEffect(() => {
    fetch("/api/settings/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { branding: Branding } | null) => {
        if (d) {
          setName(d.branding.name);
          setAccent(d.branding.accent);
          if (d.branding.currency) setCurrency(d.branding.currency);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const isPreset = accent.toLowerCase() in ACCENT_PRESETS;
  // La vista previa muestra el acento tal como se verá en el tema activo: los
  // presets están pensados para fondo claro y en oscuro se aclaran. La barra
  // lateral es azul marino en los dos temas y lleva su propio cálculo.
  const previewSet = resolveAccentSet(accent, mode);
  const navSet = resolveNavAccentSet(accent);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/settings/branding", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), accent, currency }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setError(data?.error?.message ?? "No se pudo guardar");
      return;
    }
    setSaved(true);
    // Re-renderiza el árbol server (layout raíz inyecta el acento y el título)
    router.refresh();
  }

  if (!loaded) return <p className="text-sm text-text-3">Cargando…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marca del CRM</CardTitle>
          <CardDescription>
            Este CRM es tuyo: ponle el nombre de tu negocio y tu color. Se
            reflejan en toda la interfaz y en la pantalla de inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Nombre</Label>
            <Input
              id="brand-name"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vocero"
              className="max-w-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-currency">Moneda del negocio</Label>
            <select
              id="brand-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="h-9 max-w-xs rounded-md border border-input bg-card px-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-3">
              Es la única que el Pipeline suma. Los montos capturados en otra
              moneda se muestran, pero quedan fuera del total de su columna.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color de acento</Label>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(ACCENT_PRESETS).map(([hex, preset]) => (
                <button
                  key={hex}
                  onClick={() => setAccent(hex)}
                  title={preset.label}
                  aria-label={preset.label}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    accent.toLowerCase() === hex
                      ? "border-text-2 bg-secondary"
                      : "border-border-strong hover:bg-accent"
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: resolveAccentSet(hex, mode).accent }}
                  />
                  {preset.label}
                </button>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  !isPreset ? "border-text-2 bg-secondary" : "border-border-strong hover:bg-accent"
                )}
              >
                <input
                  type="color"
                  value={isValidHex(accent) ? accent : DEFAULT_BRANDING.accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-4 w-4 cursor-pointer appearance-none border-0 bg-transparent p-0"
                />
                Personalizado
              </label>
            </div>
            <p className="text-xs text-text-3">
              Con un color personalizado, los tonos derivados (hover, fondos
              suaves) se calculan solos y se ajusta el contraste.
            </p>
          </div>

          {/* Vista previa: el bicolor real en miniatura, con el color que se
              está eligiendo (aún sin guardar). A la izquierda la barra, con la
              misma clase (`nav-dark`) y el mismo renglón activo que la de
              verdad; a la derecha la página en el tema activo, con su botón. */}
          <div
            aria-label="Vista previa de la marca"
            className="flex flex-col overflow-hidden rounded-md border border-border-strong sm:flex-row"
          >
            <div
              className="nav-dark shrink-0 bg-subtle p-3 text-foreground sm:w-60"
              style={accentVars(navSet)}
            >
              <div className="px-2 pt-0.5">
                <BrandLogo
                  branding={{ name: name.trim() || DEFAULT_BRANDING.name, accent, favicon }}
                />
                <span className="kicker mt-2 block">CRM · WhatsApp</span>
              </div>
              <span className={cn(navItemClass(true), "mt-3")}>
                <Inbox className="h-[17px] w-[17px] text-brand" strokeWidth={1.8} />
                <span className="flex-1">Bandeja</span>
              </span>
            </div>
            <div
              className="flex flex-1 items-center justify-center border-t border-border-strong bg-background p-4 sm:border-l sm:border-t-0"
              style={accentVars(previewSet)}
            >
              <span className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-brand-fg shadow-sm">
                Botón de ejemplo
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm" style={{ color: previewSet.text }}>Marca guardada ✓</p>}
          <Button disabled={saving || !name.trim()} onClick={() => void save()}>
            {saving ? "Guardando…" : "Guardar marca"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger-soft">
        <CardHeader>
          <CardTitle className="text-danger-text">Zona de peligro</CardTitle>
          <CardDescription>
            Borra todos los contactos de la organización. Esto también eliminará permanentemente todas sus conversaciones, mensajes y tratos. Esta acción dejará tu CRM como nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setWiping(true)}>
            Eliminar todos los contactos y datos
          </Button>
        </CardContent>
      </Card>

      {wiping && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-danger-soft bg-popover p-5 shadow-xl">
            <h3 className="mb-2 font-semibold text-danger-text">¿Eliminar TODOS los contactos?</h3>
            <p className="mb-4 text-sm leading-relaxed text-text-2">
              Esta acción borrará <strong>todos los contactos</strong>, conversaciones, mensajes y oportunidades del pipeline en este espacio de trabajo.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-text-2">
              Para confirmar, escribe <strong>ELIMINAR</strong> abajo:
            </p>
            <Input
              value={wipeConfirm}
              onChange={(e) => setWipeConfirm(e.target.value)}
              placeholder="ELIMINAR"
              className="mb-6"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setWiping(false);
                  setWipeConfirm("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={wipeConfirm !== "ELIMINAR" || wipingReq}
                onClick={async () => {
                  setWipingReq(true);
                  await fetch("/api/settings/contacts", { method: "DELETE" }).catch(() => null);
                  setWipingReq(false);
                  setWiping(false);
                  setWipeConfirm("");
                  router.push("/contacts");
                }}
              >
                {wipingReq ? "Eliminando…" : "Sí, eliminar todo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

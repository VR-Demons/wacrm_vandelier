"use client";

import { useEffect, useState } from "react";
import type { TemplateDto } from "@/lib/types";
import { countVariables } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Selector de plantilla aprobada para conversaciones con ventana cerrada
 * (FR-005/FR-051). Sin plantillas aprobadas muestra el estado vacío.
 */
export function TemplateSender({
  conversationId,
  onSent,
}: {
  conversationId: string;
  onSent: () => void;
}) {
  const [templates, setTemplates] = useState<TemplateDto[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d: { templates?: TemplateDto[] }) => {
        if (!cancelled) {
          setTemplates(
            (d.templates ?? []).filter((t) => t.status === "approved")
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (templates === null) {
    return <p className="text-xs text-muted-foreground">Cargando plantillas…</p>;
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay plantillas aprobadas. Créalas en{" "}
        <a href="/settings/templates" className="text-primary hover:underline">
          Configuración → Plantillas
        </a>{" "}
        y espera la aprobación de Meta.
      </p>
    );
  }

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  // Map out dynamic variables from variablesMap or fallback to body variables if empty
  const variablesMap = selected?.variablesMap || {};
  let variableKeys = Object.keys(variablesMap);
  if (variableKeys.length === 0 && selected) {
    const legacyCount = countVariables(selected.body);
    variableKeys = Array.from({ length: legacyCount }, (_, i) => `body_${i + 1}`);
  }

  const missingValue = variableKeys.some((k) => !(variables[k] ?? "").trim());

  async function send() {
    if (!selected || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(
      `/api/conversations/${conversationId}/messages/template`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: selected.id,
          variables: variableKeys.length > 0 ? variables : undefined,
        }),
      }
    );
    setSending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setError(data?.error?.message ?? "No se pudo enviar la plantilla");
      return;
    }
    setSelectedId("");
    setVariables({});
    onSent();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="template-select">Plantilla aprobada</Label>
        <select
          id="template-select"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setVariables({});
          }}
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Elige una plantilla…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.language})
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className="rounded-md bg-subtle p-2.5 text-xs text-muted-foreground space-y-2">
          {selected.header && (
            <div className="font-semibold text-foreground">
              {(selected.header as any).text || (selected.header as any).format}
            </div>
          )}
          <p>{selected.body}</p>
          {selected.footer && <p className="opacity-75">{selected.footer}</p>}
        </div>
      )}
      {variableKeys.map((key) => {
        const label = variablesMap[key] || `Variable {{${key.split('_')[1]}}}`;
        return (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`template-variable-${key}`}>
              {label}
            </Label>
            <Input
              id={`template-variable-${key}`}
              value={variables[key] ?? ""}
              onChange={(e) =>
                setVariables((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              placeholder={
                key.startsWith("header") && label.includes("URL")
                  ? "https://..."
                  : "Valor"
              }
            />
          </div>
        );
      })}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        onClick={() => void send()}
        disabled={!selected || sending || missingValue}
      >
        {sending ? "Enviando…" : "Enviar plantilla"}
      </Button>
    </div>
  );
}

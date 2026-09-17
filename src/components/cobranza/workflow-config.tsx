"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Config = {
  active: boolean;
  flowPreventivo: boolean;
  flowPayday: boolean;
  flowAtrasado: boolean;
  flowEmail: boolean;
  templatePreventivo: string | null;
  templatePayday: string | null;
  templateAtrasado: string | null;
};

type Template = {
  id: string;
  name: string;
  language: string;
};

export function WorkflowConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/cobranza/config").then((res) => res.json()),
      fetch("/api/templates").then((res) => res.json()),
    ])
      .then(([configRes, tplRes]) => {
        if (configRes.data) setConfig(configRes.data);
        if (tplRes.templates) setTemplates(tplRes.templates);
      })
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (key: keyof Config, value: any) => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await fetch("/api/cobranza/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      alert("Configuración guardada exitosamente");
    } catch (err) {
      console.error(err);
      alert("Error guardando la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  }

  if (!config) return <p>Error loading config</p>;

  return (
    <Card className="p-6 space-y-6 w-full">
      <h2 className="text-xl font-bold">Configuración de Flujos</h2>
      
      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="active" 
          checked={config.active} 
          onChange={(e) => handleChange("active", e.target.checked)} 
          className="w-4 h-4"
        />
        <Label htmlFor="active">Habilitar automatización de cobranza</Label>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="flowPreventivo" 
              checked={config.flowPreventivo} 
              onChange={(e) => handleChange("flowPreventivo", e.target.checked)} 
              className="w-4 h-4"
            />
            <Label htmlFor="flowPreventivo">Recordatorio Preventivo (3 días antes)</Label>
          </div>
          {config.flowPreventivo && (
            <select
              value={config.templatePreventivo || ""}
              onChange={(e) => handleChange("templatePreventivo", e.target.value)}
              className="border rounded p-1 text-sm w-48"
            >
              <option value="">-- Seleccionar --</option>
              {templates.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="flowPayday" 
              checked={config.flowPayday} 
              onChange={(e) => handleChange("flowPayday", e.target.checked)} 
              className="w-4 h-4"
            />
            <Label htmlFor="flowPayday">Día de Pago (El mismo día)</Label>
          </div>
          {config.flowPayday && (
            <select
              value={config.templatePayday || ""}
              onChange={(e) => handleChange("templatePayday", e.target.value)}
              className="border rounded p-1 text-sm w-48"
            >
              <option value="">-- Seleccionar --</option>
              {templates.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="flowAtrasado" 
              checked={config.flowAtrasado} 
              onChange={(e) => handleChange("flowAtrasado", e.target.checked)} 
              className="w-4 h-4"
            />
            <Label htmlFor="flowAtrasado">Recordatorio Atrasados (+1, +3, +5 días)</Label>
          </div>
          {config.flowAtrasado && (
            <select
              value={config.templateAtrasado || ""}
              onChange={(e) => handleChange("templateAtrasado", e.target.value)}
              className="border rounded p-1 text-sm w-48"
            >
              <option value="">-- Seleccionar --</option>
              {templates.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="flowEmail" 
            checked={config.flowEmail} 
            onChange={(e) => handleChange("flowEmail", e.target.checked)} 
            className="w-4 h-4"
          />
          <Label htmlFor="flowEmail">Enviar correos simultáneamente si hay email</Label>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar Configuración
        </Button>
      </div>
    </Card>
  );
}

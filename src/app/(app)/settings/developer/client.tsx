"use client";

import React, { useState } from "react";
import { generateNewApiKey, revokeApiKey, updateOutboxDelayLimit } from "./actions";

export function DeveloperSettingsClient({
  initialDelay,
  initialPrefix,
  organizationId,
}: {
  initialDelay: number;
  initialPrefix: string | null;
  organizationId: string;
}) {
  const [delay, setDelay] = useState(initialDelay);
  const [prefix, setPrefix] = useState<string | null>(initialPrefix);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    const res = await generateNewApiKey(organizationId);
    if (res.key) {
      setNewKey(res.key);
      setPrefix(res.key.substring(0, 12));
    }
  };

  const handleRevoke = async () => {
    await revokeApiKey(organizationId);
    setPrefix(null);
    setNewKey(null);
  };

  const handleSaveDelay = async () => {
    await updateOutboxDelayLimit(organizationId, delay);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Clave API (x-api-key)</h2>
        <p className="text-sm text-muted-foreground">
          Usa esta clave para integrar servicios externos.
        </p>
      </div>

      {newKey && (
        <div className="rounded bg-green-50 p-4 border border-green-200">
          <p className="text-sm font-semibold text-green-900">Guarda tu clave, no se volverá a mostrar:</p>
          <code className="block mt-2 bg-white p-2 rounded border">{newKey}</code>
        </div>
      )}

      {prefix && !newKey && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{prefix}...</span>
          <button onClick={handleRevoke} className="text-sm text-red-600 underline">
            Revocar
          </button>
        </div>
      )}

      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium"
      >
        Generar Nueva Clave API
      </button>

      <div className="pt-6 border-t">
        <h2 className="text-lg font-medium">Límite de Envío (Outbox)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Tiempo de espera en milisegundos entre cada mensaje automático.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="border rounded px-3 py-2 text-sm w-32"
          />
          <button
            onClick={handleSaveDelay}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-medium border"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

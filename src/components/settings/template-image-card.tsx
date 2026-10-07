"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Trash2 } from "lucide-react";
import {
  FAVICON_MIMES as IMAGE_MIMES,
  MAX_FAVICON_BYTES as MAX_IMAGE_BYTES,
} from "@/lib/favicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TemplateImageCard({ initialLogo }: { initialLogo: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const [actual, setActual] = useState(initialLogo);

  const src = actual ? `${actual}&r=${rev}` : null;

  async function subir(file: File) {
    setError(null);
    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        `La imagen no puede pasar de ${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`
      );
      return;
    }
    setSubiendo(true);
    const res = await fetch("/api/settings/templates/image", {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    }).catch(() => null);
    setSubiendo(false);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setError(data?.error?.message ?? "No se pudo subir la imagen");
      return;
    }
    const data = (await res.json()) as { logo: string };
    setActual(data.logo);
    setRev((v) => v + 1);
    router.refresh();
  }

  async function quitar() {
    setError(null);
    setSubiendo(true);
    const res = await fetch("/api/settings/templates/image", {
      method: "DELETE",
    }).catch(() => null);
    setSubiendo(false);
    if (!res?.ok) {
      setError("No se pudo quitar la imagen");
      return;
    }
    setActual(null);
    setRev((v) => v + 1);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagen de plantillas</CardTitle>
        <p className="text-sm text-text-3">
          Esta imagen se enviará automáticamente como encabezado en las plantillas aprobadas que requieran una imagen (Imagen URL), para no tener que subirla en cada envío.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt="Vista previa de imagen de plantillas"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border bg-card object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg border border-dashed bg-card flex items-center justify-center">
              <span className="text-muted-foreground text-xs text-center leading-tight">Sin<br/>imagen</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              {actual ? "Imagen configurada" : "Sin imagen configurada"}
            </p>
            <p className="mt-0.5 text-xs text-text-3">
              {actual
                ? "Esta imagen se adjuntará automáticamente a las plantillas con encabezado."
                : "Puedes subir una imagen por defecto para tus plantillas con encabezado."}
            </p>
          </div>
        </div>

        <input
          ref={input}
          type="file"
          accept={IMAGE_MIMES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void subir(f);
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={subiendo}
            onClick={() => input.current?.click()}
          >
            <ImageUp className="h-4 w-4" />
            {subiendo ? "Subiendo…" : actual ? "Cambiar imagen" : "Subir imagen"}
          </Button>
          {actual && (
            <Button variant="ghost" disabled={subiendo} onClick={() => void quitar()}>
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
        </div>

        <p className="text-xs text-text-3">
          PNG, SVG, ICO, JPEG o WebP, hasta{" "}
          {Math.round(MAX_IMAGE_BYTES / 1024)} KB.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

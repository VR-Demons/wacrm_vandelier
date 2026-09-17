import { cobranzaEnabled } from "@/server/cobranza/flag";
import { notFound } from "next/navigation";
import { RunsClient } from "./runs-client";

export default function CobranzaRunsPage() {
  if (!cobranzaEnabled()) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Historial de Ejecuciones</h1>
      <p className="text-muted-foreground">
        Revisa el estado de todas las campañas de cobranza que se han ejecutado en tu organización.
      </p>
      <RunsClient />
    </div>
  );
}

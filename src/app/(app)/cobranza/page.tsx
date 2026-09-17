import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import { RecordsClient } from "@/components/cobranza/records-client";
import { SpecialCasesPanel } from "@/components/cobranza/special-cases-panel";
import { WorkflowConfig } from "@/components/cobranza/workflow-config";

export const dynamic = "force-dynamic";

export default async function CobranzaPage() {
  await requireSession();

  if (!cobranzaEnabled()) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cobranza y Recuperación</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SpecialCasesPanel />
          <RecordsClient />
        </div>
        <div className="xl:col-span-1">
          <WorkflowConfig />
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import { RecordsClient } from "@/components/cobranza/records-client";

export const dynamic = "force-dynamic";

export default async function CobranzaPage() {
  await requireSession();

  if (!cobranzaEnabled()) {
    notFound();
  }

  return <RecordsClient />;
}

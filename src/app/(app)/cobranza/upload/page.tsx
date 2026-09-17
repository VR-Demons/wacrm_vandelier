import { requireSession } from "@/lib/auth/session";
import { cobranzaEnabled } from "@/server/cobranza/flag";
import { notFound } from "next/navigation";
import UploadClient from "@/components/cobranza/upload-client";

export const metadata = {
  title: "Subir Cobranza | Vocero CRM",
};

export default async function CobranzaUploadPage() {
  await requireSession();

  if (!cobranzaEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subir Archivo de Cobranza</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube tu archivo de excel con los datos de cobranza para procesar los arrendamientos y pagos.
        </p>
      </div>

      <UploadClient />
    </div>
  );
}

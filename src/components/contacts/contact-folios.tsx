import React from "react";
import { Calendar, Hash } from "lucide-react";
import type { ContactFolioSummaryDto } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function formatFechaExigibilidad(fechaIso: string | null): string {
  if (!fechaIso) return "—";
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

export function formatProducto(prod: string | null): string {
  if (!prod) return "Sin clasificar";
  const upper = prod.trim().toUpperCase();
  if (upper === "PRESTAMO") return "Préstamo";
  if (upper === "ARRENDAMIENTO") return "Arrendamiento";
  return prod.charAt(0).toUpperCase() + prod.slice(1).toLowerCase();
}

export function ContactFoliosList({
  folios,
  className,
}: {
  folios: ContactFolioSummaryDto[];
  className?: string;
}) {
  if (!folios || folios.length === 0) {
    return (
      <div className="py-2 text-xs text-muted-foreground">
        Sin folios de cartera vinculados
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {folios.map((item) => {
        const prodLabel = formatProducto(item.producto);
        const isPrestamo = prodLabel.toLowerCase().includes("préstamo");

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-card p-2.5 text-xs shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Folio #{item.folio}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Exigibilidad: {formatFechaExigibilidad(item.fechaExigibilidad)}</span>
              </div>
            </div>

            <Badge
              variant={isPrestamo ? "secondary" : "outline"}
              className="shrink-0 text-[11px] font-medium"
            >
              {prodLabel}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

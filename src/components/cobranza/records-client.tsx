"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RecordStatus = "active" | "ya_pague" | "wrong_number" | "no_response" | "resolved";

interface RecordDto {
  id: string;
  folio: string;
  clientName: string;
  phone: string;
  totalAmount: number;
  status: RecordStatus;
}

interface ListResponse {
  records: RecordDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_LABELS: Record<RecordStatus, string> = {
  active: "Activo",
  ya_pague: "Ya pagué",
  wrong_number: "Número equivocado",
  no_response: "Sin respuesta",
  resolved: "Resuelto",
};

function StatusBadge({ status }: { status: RecordStatus }) {
  switch (status) {
    case "active":
      return <Badge variant="default">{STATUS_LABELS[status]}</Badge>;
    case "ya_pague":
    case "resolved":
      return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
    case "wrong_number":
      return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>;
    case "no_response":
      return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function RecordsClient() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const typed = inputRef.current?.value ?? "";
    if (typed) setQuery(typed);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "50",
    });
    if (query.trim()) params.set("search", query.trim());

    try {
      const res = await fetch(`/api/cobranza/records?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Silent catch for initial skeleton / error boundary logic
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const t = setTimeout(() => void refetch(), 300);
    return () => clearTimeout(t);
  }, [refetch]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cents / 100);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-bold tracking-tight">Cobranza</h2>
          <Link href="/cobranza/upload">
            <Button size="sm">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
              Subir Excel
            </Button>
          </Link>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar por folio, nombre…"
              aria-label="Buscar registros"
              defaultValue=""
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 sm:w-72"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px] p-4 sm:p-6">
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Folio</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Teléfono</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : (
                  data?.records.map((record) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                      <td className="p-4 font-medium">{record.folio || "-"}</td>
                      <td className="p-4">{record.clientName || "-"}</td>
                      <td className="p-4">{record.phone || "-"}</td>
                      <td className="p-4 text-right">{formatCurrency(record.totalAmount || 0)}</td>
                      <td className="p-4">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando página {data.page} de {data.totalPages} ({data.total} registros)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

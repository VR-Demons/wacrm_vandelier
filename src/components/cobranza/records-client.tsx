"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatabaseViewer, DatabaseRecord } from "./database-viewer";

export function RecordsClient() {
  const [data, setData] = useState<DatabaseRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large page size for client-side table rendering
      const res = await fetch("/api/cobranza/records?page=1&pageSize=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.records || []);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 bg-background">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-bold tracking-tight">Cobranza</h2>
          <Link href="/cobranza/upload">
            <Button size="sm">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
              Subir Excel
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <DatabaseViewer initialData={data || []} />
          )}
        </div>
      </div>
    </div>
  );
}

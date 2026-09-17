"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Run = {
  id: string;
  runType: string;
  totalEligible: number;
  totalSent: number;
  totalFailed: number;
  status: string;
  startedAt: string;
};

export function RunsClient() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cobranza/runs?page=${page}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setRuns(data.data);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card className="p-6">
      {loading && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-4" />}
      {!loading && runs.length === 0 && (
        <p className="text-muted-foreground">No hay ejecuciones registradas.</p>
      )}
      <div className="space-y-4">
        {runs.map((run) => (
          <div key={run.id} className="border p-4 rounded flex justify-between items-center">
            <div>
              <p className="font-semibold">
                Campaña: <span className="capitalize">{run.runType}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Iniciada: {new Date(run.startedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right text-sm space-y-1">
              <p>Estado: {run.status}</p>
              <p>Elegibles: {run.totalEligible}</p>
              <p>Enviados: {run.totalSent}</p>
              <p>Fallidos: {run.totalFailed}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button 
          variant="outline" 
          disabled={page === 1 || loading} 
          onClick={() => setPage(p => p - 1)}
        >
          Anterior
        </Button>
        <Button 
          variant="outline" 
          disabled={runs.length < 10 || loading} 
          onClick={() => setPage(p => p + 1)}
        >
          Siguiente
        </Button>
      </div>
    </Card>
  );
}

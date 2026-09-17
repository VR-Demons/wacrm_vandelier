"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle } from "lucide-react";

type SpecialCaseRecord = {
  id: string;
  folio: string;
  clientName: string;
  phone: string;
  status: "ya_pague" | "wrong_number" | "no_response";
  updatedAt: string;
};

export function SpecialCasesPanel() {
  const [records, setRecords] = useState<SpecialCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/cobranza/special-cases?page=1&limit=50");
      const json = await res.json();
      if (json.data) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error("Error fetching special cases", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await fetch("/api/cobranza/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error resolving case", err);
      alert("Error al resolver el caso");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ya_pague": return "Reporta haber pagado";
      case "wrong_number": return "Número equivocado";
      case "no_response": return "Sin respuesta / Bloqueado";
      default: return status;
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  }

  if (records.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No hay casos especiales pendientes de revisión.
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Casos Especiales Detectados</h2>
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 border rounded bg-slate-50">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{r.clientName}</span>
                <span className="text-sm text-muted-foreground">({r.folio})</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Tel: {r.phone}
              </div>
              <Badge variant="secondary" className="mt-2">
                {getStatusLabel(r.status)}
              </Badge>
            </div>
            <Button variant="outline" onClick={() => handleResolve(r.id)} className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Resuelto
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

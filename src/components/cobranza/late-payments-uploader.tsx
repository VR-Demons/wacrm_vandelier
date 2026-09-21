"use client";

import { Badge } from "@/components/ui/badge";
import { CobranzaTable, ColumnDef } from "./cobranza-table";
import { useTableState } from "./use-table-state";

export interface LatePaymentRecord {
  id: string;
  folio: string;
  clientName: string;
  phone: string;
  totalAmount: number;
  daysLate: number;
}

export function LatePaymentsUploader({ data }: { data: LatePaymentRecord[] }) {
  const tableState = useTableState<LatePaymentRecord>({
    data,
    initialPageSize: 10,
    searchableColumns: ["folio", "clientName", "phone"],
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cents / 100);
  };

  const columns: ColumnDef<LatePaymentRecord>[] = [
    {
      header: "Folio",
      accessorKey: "folio",
      sortable: true,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      sortable: true,
    },
    {
      header: "Teléfono",
      accessorKey: "phone",
      sortable: false,
    },
    {
      header: "Días Atraso",
      accessorKey: "daysLate",
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-red-600">{row.daysLate} días</span>
      )
    },
    {
      header: "Deuda Total",
      accessorKey: "totalAmount",
      sortable: true,
      cell: (row) => (
        <span className="text-right block w-full text-red-700 font-medium">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      header: "Estado",
      cell: () => (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
          Atrasado
        </Badge>
      ),
    },
  ];

  return (
    <div className="h-[700px] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-red-800">Carga de Pagos Atrasados (Late)</h2>
        <p className="text-muted-foreground text-sm">Previsualización de morosidad y vencidos.</p>
      </div>
      <CobranzaTable columns={columns} tableState={tableState} />
    </div>
  );
}

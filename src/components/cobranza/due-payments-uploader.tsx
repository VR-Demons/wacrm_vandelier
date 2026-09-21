"use client";

import { Badge } from "@/components/ui/badge";
import { CobranzaTable, ColumnDef } from "./cobranza-table";
import { useTableState } from "./use-table-state";

export interface DuePaymentRecord {
  id: string;
  folio: string;
  clientName: string;
  phone: string;
  totalAmount: number;
  dueDate: string;
}

export function DuePaymentsUploader({ data }: { data: DuePaymentRecord[] }) {
  const tableState = useTableState<DuePaymentRecord>({
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

  const columns: ColumnDef<DuePaymentRecord>[] = [
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
      header: "Fecha de Vencimiento",
      accessorKey: "dueDate",
      sortable: true,
    },
    {
      header: "Monto",
      accessorKey: "totalAmount",
      sortable: true,
      cell: (row) => (
        <span className="text-right block w-full">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      header: "Estado",
      cell: () => (
        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Preventivo
        </Badge>
      ),
    },
  ];

  return (
    <div className="h-[700px] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Carga de Pagos Regulares (Due)</h2>
        <p className="text-muted-foreground text-sm">Previsualización de arrendamientos en tiempo.</p>
      </div>
      <CobranzaTable columns={columns} data={data} tableState={tableState} />
    </div>
  );
}

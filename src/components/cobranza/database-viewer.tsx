"use client";

import { useState } from "react";
import { Check, X, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CobranzaTable, ColumnDef } from "./cobranza-table";
import { useTableState } from "./use-table-state";

export type RecordStatus = "active" | "ya_pague" | "wrong_number" | "no_response" | "resolved";

export interface DatabaseRecord {
  id: string;
  folio: string;
  clientName: string;
  phone: string;
  totalAmount: number;
  status: RecordStatus;
}

const STATUS_LABELS: Record<RecordStatus, string> = {
  active: "Activo",
  ya_pague: "Ya pagué",
  wrong_number: "Número equivocado",
  no_response: "Sin respuesta",
  resolved: "Resuelto",
};

export function DatabaseViewer({ initialData }: { initialData: DatabaseRecord[] }) {
  const [data, setData] = useState<DatabaseRecord[]>(initialData);
  const [editFormData, setEditFormData] = useState<Partial<DatabaseRecord>>({});

  const tableState = useTableState<DatabaseRecord>({
    data,
    initialPageSize: 10,
    searchableColumns: ["folio", "clientName", "phone"],
  });

  const { editingRowId, setEditingRowId } = tableState;

  const handleEdit = (record: DatabaseRecord) => {
    setEditingRowId(record.id);
    setEditFormData({ ...record });
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  const handleSave = () => {
    // In a real app, you would make an API call here.
    // For now, we update the client-side state.
    setData((prev) =>
      prev.map((r) => (r.id === editingRowId ? { ...r, ...editFormData } as DatabaseRecord : r))
    );
    setEditingRowId(null);
    setEditFormData({});
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cents / 100);
  };

  const columns: ColumnDef<DatabaseRecord>[] = [
    {
      header: "Folio",
      accessorKey: "folio",
      sortable: true,
      cell: (row, isEditing) =>
        isEditing ? (
          <Input
            value={editFormData.folio || ""}
            onChange={(e) => setEditFormData({ ...editFormData, folio: e.target.value })}
            className="h-8 w-full max-w-[120px]"
          />
        ) : (
          <span className="font-medium">{row.folio}</span>
        ),
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      sortable: true,
      cell: (row, isEditing) =>
        isEditing ? (
          <Input
            value={editFormData.clientName || ""}
            onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
            className="h-8 w-full max-w-[200px]"
          />
        ) : (
          <span>{row.clientName}</span>
        ),
    },
    {
      header: "Teléfono",
      accessorKey: "phone",
      sortable: true,
      cell: (row, isEditing) =>
        isEditing ? (
          <Input
            value={editFormData.phone || ""}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            className="h-8 w-full max-w-[150px]"
          />
        ) : (
          <span>{row.phone}</span>
        ),
    },
    {
      header: "Saldo",
      accessorKey: "totalAmount",
      sortable: true,
      cell: (row, isEditing) =>
        isEditing ? (
          <Input
            type="number"
            value={editFormData.totalAmount || 0}
            onChange={(e) => setEditFormData({ ...editFormData, totalAmount: Number(e.target.value) })}
            className="h-8 w-full max-w-[120px]"
          />
        ) : (
          <span className="text-right block w-full">{formatCurrency(row.totalAmount)}</span>
        ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row, isEditing) => {
        if (isEditing) {
          return (
            <Select
              value={editFormData.status}
              onValueChange={(val: RecordStatus) => setEditFormData({ ...editFormData, status: val })}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (row.status === "active") variant = "default";
        else if (row.status === "ya_pague" || row.status === "resolved") variant = "secondary";
        else if (row.status === "wrong_number") variant = "destructive";

        return <Badge variant={variant}>{STATUS_LABELS[row.status]}</Badge>;
      },
    },
    {
      header: "Acciones",
      cell: (row, isEditing) => (
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-blue-600 hover:text-blue-700"
              onClick={() => handleEdit(row)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="h-[700px] p-6">
      <CobranzaTable columns={columns} tableState={tableState} />
    </div>
  );
}

import { ReactNode } from "react";
import { Search, ChevronsUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseTableStateProps } from "./use-table-state";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, isEditing: boolean) => ReactNode;
  sortable?: boolean;
}

export interface CobranzaTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  tableState: ReturnType<typeof import("./use-table-state").useTableState<T>>;
  isLoading?: boolean;
  emptyMessage?: string;
  onEditSave?: (row: T, newValues: Partial<T>) => void;
}

export function CobranzaTable<T extends { id: string | number }>({
  columns,
  data,
  tableState,
  isLoading,
  emptyMessage = "No se encontraron resultados",
}: CobranzaTableProps<T>) {
  const {
    globalFilter,
    setGlobalFilter,
    sorting,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRecords,
    paginatedData,
    editingRowId,
    setEditingRowId,
  } = tableState;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto max-h-[600px] rounded-md border bg-card relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`h-10 px-4 text-left font-medium text-muted-foreground ${
                    col.sortable ? "cursor-pointer hover:bg-gray-50 select-none" : ""
                  }`}
                  onClick={() => col.sortable && col.accessorKey && toggleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && col.accessorKey && (
                      <span className="inline-flex">
                        {sorting?.key === col.accessorKey ? (
                          sorting.dir === "asc" ? (
                            <ArrowUp className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isEditing = editingRowId === String(row.id);
                return (
                  <tr
                    key={String(row.id)}
                    className="border-b transition-colors hover:bg-blue-50/30 last:border-0"
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className="p-4">
                        {col.cell
                          ? col.cell(row, isEditing)
                          : col.accessorKey
                          ? (row[col.accessorKey] as ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Toolbar */}
      {totalRecords > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Filas por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => setPageSize(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages} ({totalRecords} registros)
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";

export type SortDirection = "asc" | "desc";

export interface SortingState<T> {
  key: keyof T;
  dir: SortDirection;
}

export interface UseTableStateProps<T> {
  data: T[];
  initialPageSize?: number;
  searchableColumns?: (keyof T)[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableState<T extends Record<string, any>>({
  data,
  initialPageSize = 10,
  searchableColumns = [],
}: UseTableStateProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState<T> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return data;
    const lowerFilter = globalFilter.toLowerCase();
    
    return data.filter((row) => {
      // If searchableColumns provided, only search those, otherwise search all string/number values
      const keysToSearch = searchableColumns.length > 0 ? searchableColumns : Object.keys(row) as (keyof T)[];
      
      return keysToSearch.some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerFilter);
      });
    });
  }, [data, globalFilter, searchableColumns]);

  const sortedData = useMemo(() => {
    if (!sorting) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sorting.key];
      const bVal = b[sorting.key];

      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sorting.dir === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sorting]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const toggleSort = (key: keyof T) => {
    setSorting((prev) => {
      if (prev?.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc" };
        return null; // toggle off
      }
      return { key, dir: "asc" };
    });
  };

  return {
    globalFilter,
    setGlobalFilter,
    sorting,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRecords: sortedData.length,
    paginatedData,
    editingRowId,
    setEditingRowId,
  };
}

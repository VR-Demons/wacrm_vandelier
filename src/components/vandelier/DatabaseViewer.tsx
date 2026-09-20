"use client";

import { useState, useEffect, useMemo } from "react";
import { N8nService } from "@/services/vandelier/n8n";
import { BackendRow } from "@/types/vandelier";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Edit2, 
  Save, 
  X,
  AlertCircle
} from "lucide-react";

interface DatabaseViewerProps {
  refreshTrigger: number;
}

export function DatabaseViewer({ refreshTrigger }: DatabaseViewerProps) {
  const [data, setData] = useState<BackendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const rowsPerPage = 10;

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BackendRow>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await N8nService.fetchDatatable();
      // Assume response is array of BackendRow.
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError(err.message || "Failed to load database data.");
      // For demo fallback if n8n not connected
      setData([
        { id: "1", name: "Juan Perez", phone: "555-1234", amount: "1500", status: "pending" },
        { id: "2", name: "Maria Garcia", phone: "555-5678", amount: "2300", status: "active" },
        { id: "3", name: "Carlos Lopez", phone: "555-9012", amount: "500", status: "resolved" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditClick = (row: BackendRow) => {
    setEditingId(row.id || null);
    setEditFormData({ ...row });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (!editingId) return;
    
    // Optimistic update
    const newData = data.map(row => 
      row.id === editingId ? { ...editFormData } : row
    );
    setData(newData);
    setEditingId(null);
    setEditFormData({});

    // In a real app, you would send the update to the backend
    // N8nService.updateDatatable([editFormData])
  };

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (!searchTerm) return true;
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const currentTableData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Dynamic columns based on data
  const columns = useMemo(() => {
    const cols = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== "id" && key !== "_original") cols.add(key);
      });
    });
    // Default columns if empty
    if (cols.size === 0) {
      cols.add("name");
      cols.add("phone");
      cols.add("amount");
      cols.add("status");
    }
    return Array.from(cols).slice(0, 5); // Limit to 5 columns for UI sanity
  }, [data]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 bg-slate-50 p-4 gap-4">
        <h3 className="text-lg font-bold text-slate-800">Database Records</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="m-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
          <AlertCircle size={18} />
          <span>{error} (Showing placeholder data)</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col}
                    <ArrowUpDown size={14} className="text-slate-400" />
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <span className="text-slate-500">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : currentTableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-slate-500">
                  No records found matching your criteria.
                </td>
              </tr>
            ) : (
              currentTableData.map((row, i) => (
                <tr key={row.id || i} className="transition-colors hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editFormData[col] || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, [col]: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className={col === "status" ? 
                          `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            String(row[col]).toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            String(row[col]).toLowerCase() === 'resolved' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-slate-100 text-slate-800'
                          }` : ""
                        }>
                          {String(row[col] || "-")}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {editingId === row.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleEditSave}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(row)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
        <span className="text-sm text-slate-500">
          Showing {sortedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} records
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

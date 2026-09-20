"use client";

import { useState } from "react";
import { Uploader } from "./Uploader";
import { N8nService } from "@/services/vandelier/n8n";
import { BackendRow } from "@/types/vandelier";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ReportsDashboardProps {
  onDataUpdated: () => void;
}

export function ReportsDashboard({ onDataUpdated }: ReportsDashboardProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleUploadSuccess = async (data: BackendRow[]) => {
    setStatus("uploading");
    setMessage("Syncing parsed data to n8n backend...");

    try {
      // In a real scenario, this updates the n8n datatable
      await N8nService.updateDatatable(data);
      setStatus("success");
      setMessage(`Successfully processed and synced ${data.length} records.`);
      onDataUpdated();
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to sync data with n8n backend.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-800">Data Import</h3>
      <p className="mb-6 text-sm text-slate-500">
        Upload your Excel or CSV files here. The system will automatically map known columns 
        like phone, name, email, and amount.
      </p>

      <Uploader onUploadSuccess={handleUploadSuccess} />

      {status === "uploading" && (
        <div className="mt-6 flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mr-3" />
          <span className="text-slate-600">{message}</span>
        </div>
      )}

      {status === "success" && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertCircle size={20} className="text-rose-600" />
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
}

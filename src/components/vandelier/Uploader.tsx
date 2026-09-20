"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, X } from "lucide-react";
import { parseExcelFile } from "@/utils/vandelier/excelParser";
import { BackendRow } from "@/types/vandelier";

interface UploaderProps {
  onUploadSuccess: (data: BackendRow[]) => void;
}

export function Uploader({ onUploadSuccess }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xls|xlsx|csv)$/i)) {
      setError("Please upload a valid Excel (.xls, .xlsx) or CSV file.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      onUploadSuccess(data);
      setFile(null); // Clear after success
    } catch (err: any) {
      setError(err.message || "Failed to process the file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
        />

        {!file ? (
          <>
            <div className="mb-4 rounded-full bg-indigo-100 p-4">
              <UploadCloud size={32} className="text-indigo-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-700">
              Upload your data file
            </h3>
            <p className="mb-6 text-sm text-slate-500">
              Drag and drop your Excel or CSV file here, or click to browse.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-white px-5 py-2 font-medium text-slate-700 shadow-sm border border-slate-200 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Browse Files
            </button>
          </>
        ) : (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="mb-6 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileType size={24} className="text-indigo-500 flex-shrink-0" />
                <div className="truncate text-left">
                  <p className="truncate font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                disabled={isUploading}
              >
                <X size={18} />
              </button>
            </div>
            <button
              onClick={handleProcessFile}
              disabled={isUploading}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white shadow-sm transition-all ${
                isUploading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Process & Upload Data
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
    </div>
  );
}

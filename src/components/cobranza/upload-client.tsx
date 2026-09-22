/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, FileType, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DuePaymentsUploader } from "./due-payments-uploader";
import { LatePaymentsUploader } from "./late-payments-uploader";

type UploadType = "due" | "late";

interface PreviewData {
  productType: string;
  recordCount: number;
  records: Array<{
    folio: string;
    clientName: string;
    totalAmount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  errors: string[];
}

interface ConfirmResult {
  inserted: number;
  updated: number;
  linked: number;
  created: number;
  message?: string;
  error?: string;
}

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>("due");
  const [isDragging, setIsDragging] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount / 100);
  };

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;
      if (
        droppedFile.name.endsWith(".xlsx") || 
        droppedFile.name.endsWith(".csv") ||
        droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        droppedFile.type === "text/csv"
      ) {
        setFile(droppedFile);
        setUploadError(null);
      } else {
        setUploadError("Por favor selecciona un archivo .xlsx o .csv válido.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setUploadError("Por favor selecciona un archivo primero.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadType", uploadType);

    try {
      const res = await fetch("/api/cobranza/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al procesar el archivo.");
      }

      setPreviewData(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setUploadError(err.message || "Error de red al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    
    setIsConfirming(true);
    setUploadError(null);

    try {
      const res = await fetch("/api/cobranza/upload/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadType,
          productType: previewData.productType,
          records: previewData.records,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al confirmar los datos.");
      }

      setConfirmResult(data);
      router.refresh(); // Refresh to update any server-side state if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setUploadError(err.message || "Error de red al confirmar los datos.");
    } finally {
      setIsConfirming(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setConfirmResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (confirmResult) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h2 className="mb-2 text-2xl font-semibold text-green-800">¡Carga Completada Exitosamente!</h2>
        
        <div className="mx-auto mt-6 max-w-sm rounded-md bg-white p-4 shadow-sm">
          <ul className="space-y-3 text-left text-sm text-gray-700">
            <li className="flex justify-between border-b pb-2">
              <span>Registros Insertados:</span>
              <span className="font-semibold">{confirmResult.inserted}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Registros Actualizados:</span>
              <span className="font-semibold">{confirmResult.updated}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Pagos Vinculados:</span>
              <span className="font-semibold">{confirmResult.linked}</span>
            </li>
            <li className="flex justify-between pb-1">
              <span>Nuevos Clientes/Entidades:</span>
              <span className="font-semibold">{confirmResult.created}</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/cobranza"
            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Cobranza
          </Link>
          <button
            onClick={resetState}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Subir Otro Archivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${!previewData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <span className={`font-medium ${!previewData ? 'text-gray-900' : 'text-gray-500'}`}>Selección de Archivo</span>
        </div>
        <div className="h-px w-16 bg-gray-200 sm:w-32"></div>
        <div className="flex items-center space-x-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${previewData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <span className={`font-medium ${previewData ? 'text-gray-900' : 'text-gray-500'}`}>Vista Previa</span>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center rounded-md bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0 text-red-400" />
          <p>{uploadError}</p>
        </div>
      )}

      {!previewData ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Cobranza</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUploadType("due")}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors ${
                  uploadType === "due"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileType className={`mb-2 h-6 w-6 ${uploadType === "due" ? "text-blue-600" : "text-gray-400"}`} />
                <span className="font-medium">Regulares (Due)</span>
                <span className="text-xs opacity-75">Arrendamientos en tiempo</span>
              </button>
              
              <button
                type="button"
                onClick={() => setUploadType("late")}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors ${
                  uploadType === "late"
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <AlertCircle className={`mb-2 h-6 w-6 ${uploadType === "late" ? "text-red-600" : "text-gray-400"}`} />
                <span className="font-medium">Atrasados (Late)</span>
                <span className="text-xs opacity-75">Morosidad y vencidos</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Archivo de Excel / CSV</label>
            
            <div
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <>
                  <FileSpreadsheet className="mb-4 h-12 w-12 text-green-500" />
                  <p className="mb-1 text-sm font-medium text-green-800">{file.name}</p>
                  <p className="text-xs text-green-600">{(file.size / 1024).toFixed(2)} KB</p>
                  <p className="mt-4 text-xs text-green-700 hover:underline">Haz clic o arrastra para cambiar el archivo</p>
                </>
              ) : (
                <>
                  <Upload className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-1 text-sm font-medium text-gray-900">
                    Haz clic o arrastra un archivo aquí
                  </p>
                  <p className="text-xs text-gray-500">Soporta formatos .xlsx y .csv</p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={!file || isUploading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Subir y Previsualizar"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Vista Previa de Datos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Verifica los datos extraídos del archivo antes de confirmarlos. Producto: <span className="font-semibold text-gray-700">{previewData.productType}</span> | Registros: <span className="font-semibold text-gray-700">{previewData.recordCount}</span>
            </p>
          </div>
          
          {previewData.errors && previewData.errors.length > 0 && (
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
              <h4 className="flex items-center text-sm font-medium text-yellow-800">
                <AlertCircle className="mr-2 h-4 w-4" />
                Advertencias del archivo:
              </h4>
              <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                {previewData.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            {uploadType === "due" ? (
              <DuePaymentsUploader data={previewData.records.map((r, i) => ({ id: String(i), folio: r.folio, clientName: r.clientName || r.cliente || "-", phone: r.phone || r.telefono || "-", totalAmount: r.totalAmount, dueDate: r.dueDate || "-" }))} />
            ) : (
              <LatePaymentsUploader data={previewData.records.map((r, i) => ({ id: String(i), folio: r.folio, clientName: r.clientName || r.cliente || "-", phone: r.phone || r.telefono || "-", totalAmount: r.totalAmount, daysLate: r.daysLate || 0 }))} />
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 px-6 py-4 rounded-b-lg border-t">
            <button
              onClick={resetState}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancelar y Subir Otro
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar y Procesar"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

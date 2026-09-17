import * as XLSX from "xlsx";
import { normalizeMx } from "@/lib/meta/client";

export interface ParsedRecord {
  folio: string;
  clientName: string;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  rfc: string | null;
  personalidad: "MORAL" | "FISICA" | null;
  dueDate: Date | null;
  totalAmount: number | null;
  lateAmount: number | null;
  paid: boolean;
}

export interface ParseResult {
  productType: string;
  records: ParsedRecord[];
  errors: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizePersonalidad = (val: any): "MORAL" | "FISICA" => {
  if (!val) return "MORAL";
  const normalized = String(val)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
  return normalized === "FISICA" ? "FISICA" : "MORAL";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseDate = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel date serial
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseMoneyCents = (val: any): number | null => {
  if (!val) return 0;
  if (typeof val === "number") return Math.round(val * 100);
  const clean = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

export function parseExcel(buffer: Buffer): ParseResult {
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  let productType = "PRESTAMOS"; // Default

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { productType, records: [], errors: ["El archivo de Excel no contiene hojas de cálculo."] };
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return { productType, records: [], errors: ["No se pudo leer la hoja de cálculo."] };
    }
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any[];

    // 1. Detect product type (scan first 20 rows)
    const rowsToScan = rows.slice(0, 20);
    for (const row of rowsToScan) {
      if (!row) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowString = Array.from((row as any[]) || [])
        .map((cell) => (cell ? String(cell).toUpperCase() : ""))
        .join(" ");

      if (rowString.includes("ARRENDAMIENTOS")) {
        productType = "ARRENDAMIENTOS";
        break;
      }
      if (rowString.includes("PRÉSTAMOS") || rowString.includes("PRESTAMOS")) {
        productType = "PRESTAMOS";
      }
    }

    // 2. Find header row dynamically
    let headerRowIndex = -1;
    const colMap = {
      folio: -1,
      clientName: -1,
      phone: -1,
      email: -1,
      contactName: -1,
      rfc: -1,
      personalidad: -1,
      dueDate: -1,
      totalAmount: -1,
      lateAmount: -1,
      paid: -1,
    };

    for (let i = 0; i < Math.min(30, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowUpper = (row as any[]).map(c => c ? String(c).toUpperCase().trim() : "");
      
      const folioIdx = rowUpper.findIndex(c => c.includes("FOLIO") || c === "CONTRATO");
      const clientIdx = rowUpper.findIndex(c => c.includes("CLIENTE") || c.includes("ACREDITADO") || c.includes("ARRENDATARIO"));
      
      if (folioIdx !== -1 && clientIdx !== -1) {
        headerRowIndex = i;
        colMap.folio = folioIdx;
        colMap.clientName = clientIdx;
        colMap.phone = rowUpper.findIndex(c => c.includes("TEL") || c.includes("CELular"));
        colMap.email = rowUpper.findIndex(c => c.includes("CORREO") || c.includes("EMAIL"));
        colMap.contactName = rowUpper.findIndex(c => c.includes("CONTACTO"));
        colMap.rfc = rowUpper.findIndex(c => c === "RFC");
        colMap.personalidad = rowUpper.findIndex(c => c.includes("PERSONALIDAD") || c.includes("TIPO PERSONA"));
        colMap.dueDate = rowUpper.findIndex(c => c.includes("FECHA PAGO") || c.includes("VENCIMIENTO") || c === "FECHA");
        colMap.totalAmount = rowUpper.findIndex(c => c.includes("SALDO TOTAL") || c.includes("TOTAL A PAGAR") || c.includes("DEUDA"));
        colMap.lateAmount = rowUpper.findIndex(c => c.includes("MORA") || c.includes("RECARGOS") || c.includes("SALDO VENCIDO"));
        colMap.paid = rowUpper.findIndex(c => c === "PAGADO" || c === "ESTATUS");
        break;
      }
    }

    if (headerRowIndex === -1) {
      return { productType, records: [], errors: ["No se encontró la fila de encabezados (Folio, Cliente)."] };
    }

    // 3. Map records
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = rows[i] as any[];
      if (!row || row.length === 0) continue;

      const folio = row[colMap.folio] ? String(row[colMap.folio]).trim() : "";
      const clientName = row[colMap.clientName] ? String(row[colMap.clientName]).trim() : "";

      if (!folio || !clientName) continue; // Skip empty rows

      const phoneRaw = colMap.phone !== -1 ? row[colMap.phone] : null;
      // Normalizes phone numbers (521→52) -> wait, `normalizeMx` from meta/client normalizes it properly.
      const phone = phoneRaw ? normalizeMx(String(phoneRaw).replace(/[^0-9]/g, "")) : null;

      const personalidadRaw = colMap.personalidad !== -1 ? row[colMap.personalidad] : null;
      const personalidad = normalizePersonalidad(personalidadRaw);

      records.push({
        folio,
        clientName,
        phone,
        email: colMap.email !== -1 && row[colMap.email] ? String(row[colMap.email]).trim() : null,
        contactName: colMap.contactName !== -1 && row[colMap.contactName] ? String(row[colMap.contactName]).trim() : null,
        rfc: colMap.rfc !== -1 && row[colMap.rfc] ? String(row[colMap.rfc]).trim() : null,
        personalidad,
        dueDate: colMap.dueDate !== -1 ? parseDate(row[colMap.dueDate]) : null,
        totalAmount: colMap.totalAmount !== -1 ? parseMoneyCents(row[colMap.totalAmount]) : null,
        lateAmount: colMap.lateAmount !== -1 ? parseMoneyCents(row[colMap.lateAmount]) : null,
        paid: colMap.paid !== -1 ? String(row[colMap.paid]).toUpperCase().includes("SI") || String(row[colMap.paid]).toUpperCase() === "PAGADO" : false,
      });
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    errors.push(err.message || "Error procesando archivo Excel");
  }

  return { productType, records, errors };
}

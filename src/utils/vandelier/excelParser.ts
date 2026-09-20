import * as xlsx from 'xlsx';
import { BackendRow } from '@/types/vandelier';

/**
 * Parses an Excel or CSV file and converts it into a standardized array of BackendRow objects.
 * Applies heuristics to identify and normalize column names.
 */
export const parseExcelFile = async (file: File): Promise<BackendRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Read the file data
        const workbook = xlsx.read(data, { type: 'binary' });

        // Grab the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON array
        const rawJson: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

        // Heuristics mapping for known column types
        const columnMap: Record<string, string[]> = {
          phone: ['telefono', 'phone', 'celular', 'whatsapp', 'tel'],
          name: ['nombre', 'name', 'cliente', 'usuario', 'full_name', 'fullname'],
          email: ['email', 'correo', 'mail'],
          amount: ['monto', 'amount', 'deuda', 'saldo', 'total'],
          status: ['estado', 'status', 'estatus', 'situacion'],
        };

        const identifyColumn = (header: string): string => {
          const normalizedHeader = header.toLowerCase().trim();
          for (const [standardKey, aliases] of Object.entries(columnMap)) {
            if (aliases.some(alias => normalizedHeader.includes(alias))) {
              return standardKey;
            }
          }
          // Fallback: clean the header string
          return normalizedHeader.replace(/[^a-z0-9]/g, '_');
        };

        const processed: BackendRow[] = rawJson.map((row, index) => {
          const newRow: BackendRow = {
            id: `imported-${Date.now()}-${index}`,
            _original: row // Keep original data for reference if needed
          };

          for (const key in row) {
            const standardKey = identifyColumn(key);
            // If multiple columns map to the same standard key, we keep the first one
            // or concatenate. Here we just assign if it doesn't exist.
            if (!newRow[standardKey] || standardKey === identifyColumn(key)) {
              newRow[standardKey] = row[key];
            }
            // Keep the original key-value pair as well for full fidelity
            newRow[key] = row[key];
          }

          return newRow;
        });

        resolve(processed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);

    // xlsx can parse binary strings
    reader.readAsBinaryString(file);
  });
};

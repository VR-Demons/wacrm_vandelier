import { normalizeMx } from "@/lib/meta/client";

/**
 * Normaliza teléfonos de contactos o folios para resolución canónica en WhatsApp CRM.
 * - Elimina espacios, guiones, paréntesis y signos '+'.
 * - Si tiene 10 dígitos (número nacional de México), antepone '52'.
 * - Si tiene 13 dígitos y empieza con '521', usa normalizeMx para convertir a '52...'.
 * - Si tiene 12 dígitos y empieza con '52', se conserva tal cual.
 */
export function normalizeContactPhone(raw: string | number | null | undefined): string {
  if (!raw) return "";
  const str = String(raw).trim();
  const cleaned = str.replace(/[\s\-()+]/g, "");
  if (/^\d{10}$/.test(cleaned)) {
    return `52${cleaned}`;
  }
  return normalizeMx(cleaned);
}

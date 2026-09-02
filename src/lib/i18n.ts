export const LANG_COOKIE = "vocero-lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type SupportedLanguage = "es" | "en";

export const LANG_LABELS: Record<SupportedLanguage, string> = {
  es: "Español",
  en: "English",
};

export function normalizeLanguagePreference(
  value: string | null | undefined
): SupportedLanguage {
  return value === "en" ? "en" : "es";
}

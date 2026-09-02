"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import esDict from "@/i18n/es.json";
import enDict from "@/i18n/en.json";
import { SupportedLanguage } from "@/lib/i18n";

type Dictionary = typeof esDict;

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: SupportedLanguage;
}) {
  const [lang, setLang] = useState<SupportedLanguage>(initialLang);
  const [dict, setDict] = useState<Dictionary>(initialLang === "en" ? enDict : esDict);

  useEffect(() => {
    setDict(lang === "en" ? enDict : esDict);
    document.cookie = `vocero-lang=${lang}; max-age=${60 * 60 * 24 * 365}; path=/`;
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (path: string): string => {
    const keys = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dict;
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

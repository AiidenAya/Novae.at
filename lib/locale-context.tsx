"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale } from "./use-locale";

type T = (typeof translations)[Locale];

interface LocaleContextValue {
  locale: Locale;
  t: T;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: translations.en,
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("novae-locale") as Locale | null;
    if (saved === "fr" || saved === "en") setLocale(saved);
  }, []);

  function toggle() {
    const next: Locale = locale === "en" ? "fr" : "en";
    setLocale(next);
    localStorage.setItem("novae-locale", next);
  }

  return (
    <LocaleContext.Provider value={{ locale, t: translations[locale], toggle }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  return useContext(LocaleContext);
}

export function useLocaleContext() {
  return useContext(LocaleContext);
}

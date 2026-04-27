/* eslint-disable react-refresh/only-export-components */
/**
 * LanguageContext — إدارة اللغة (AR / EN)
 * يقرأ الترجمات من: src/locales/ar.json و en.json
 *
 * الاستخدام:
 *   const { t, lang, dir, toggleLang } = useLanguage();
 */

import { createContext, useContext, useState, useEffect } from "react";
import ar from "../locales/ar.json";
import en from "../locales/en.json";

const TRANSLATIONS = { ar, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("app_lang") || "ar",
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("app_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const toggleLang = () => setLang((prev) => (prev === "ar" ? "en" : "ar"));
  const t = (key) => TRANSLATIONS[lang]?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, dir, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

import { useEffect, useMemo, useState } from "react";

import { LanguageContext } from "./LanguageContextValue.js";

const STORAGE_KEY = "amanak-language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "ar";
  });

  useEffect(() => {
    const isArabic = language === "ar";

    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.body.dir = isArabic ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      setLanguage: (next) =>
        setLanguageState(next === "en" ? "en" : "ar"),
      toggleLanguage: () =>
        setLanguageState((current) => (current === "ar" ? "en" : "ar")),
      pick: (arabic, english) => (language === "ar" ? arabic : english),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

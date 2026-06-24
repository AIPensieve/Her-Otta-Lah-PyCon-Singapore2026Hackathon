import { createContext, useContext, useState, type ReactNode } from "react";
import { zh } from "./zh";
import { en } from "./en";

export type Lang = "zh" | "en";

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  toggleLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  const toggleLang = () => setLang((l) => (l === "zh" ? "en" : "zh"));
  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

/** Returns the current language code and a toggle function */
export function useLang() {
  return useContext(LangContext);
}

/** Returns the translation dictionary for the current language */
export function useT() {
  const { lang } = useContext(LangContext);
  return lang === "zh" ? zh : en;
}

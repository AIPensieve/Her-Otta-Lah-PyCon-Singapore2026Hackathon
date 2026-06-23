import { zh } from "./zh";
import { en } from "./en";

// Simple primitive i18n setup for demo purposes.
// In a real app, this would use react-i18next or next-intl.
let currentLocale = "zh";

export function setLocale(locale: "zh" | "en") {
  currentLocale = locale;
}

export function useI18n() {
  return currentLocale === "zh" ? zh : en;
}

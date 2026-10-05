import { create } from "zustand";
import { type SupportedLang, LANGUAGES, TRANSLATIONS, type LanguageMeta } from "../lib/i18n";

interface LangState {
  lang: SupportedLang;
  meta: LanguageMeta;
  setLang: (lang: SupportedLang) => void;
  t: (key: string, fallback?: string) => string;
}

const getInitialLang = (): SupportedLang => {
  const saved = localStorage.getItem("reliefgrid_lang") as SupportedLang;
  if (saved && LANGUAGES.some((l) => l.code === saved)) {
    return saved;
  }
  return "en";
};

export const useLangStore = create<LangState>((set, get) => ({
  lang: getInitialLang(),
  meta: LANGUAGES.find((l) => l.code === getInitialLang()) || LANGUAGES[0],
  setLang: (newLang: SupportedLang) => {
    localStorage.setItem("reliefgrid_lang", newLang);
    const meta = LANGUAGES.find((l) => l.code === newLang) || LANGUAGES[0];
    set({ lang: newLang, meta });
  },
  t: (key: string, fallback?: string): string => {
    if (!key) return fallback || "";
    const { lang } = get();
    const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const enDict = TRANSLATIONS.en || {};

    // 1. Exact match
    if (dictionary[key] !== undefined) return dictionary[key];

    // 2. Trimmed match
    const trimmed = key.trim();
    if (dictionary[trimmed] !== undefined) return dictionary[trimmed];

    // 3. Lowercase match
    const lower = trimmed.toLowerCase();
    if (dictionary[lower] !== undefined) return dictionary[lower];

    // 4. Capitalized match
    const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (dictionary[cap] !== undefined) return dictionary[cap];

    // 5. Fallback in English dictionary
    if (enDict[key] !== undefined) return enDict[key];
    if (enDict[trimmed] !== undefined) return enDict[trimmed];
    if (enDict[lower] !== undefined) return enDict[lower];

    // 6. Compound pattern: e.g. "4 critical" -> "4 " + translated "critical"
    const numWordMatch = trimmed.match(/^(\d+(?:,\d+)?)\s+(.+)$/);
    if (numWordMatch) {
      const num = numWordMatch[1];
      const word = numWordMatch[2];
      const transWord = dictionary[word] || dictionary[word.toLowerCase()] || enDict[word] || enDict[word.toLowerCase()];
      if (transWord && transWord !== word) {
        return `${num} ${transWord}`;
      }
    }

    return fallback !== undefined ? fallback : key;
  },
}));

export const useTranslation = () => {
  const { lang, meta, setLang, t } = useLangStore();
  return { lang, meta, setLang, t };
};

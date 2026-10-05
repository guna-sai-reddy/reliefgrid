import { create } from "zustand";

export type ThemeType = "rose" | "ocean" | "emerald" | "dark" | "sunset" | "amethyst";

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  primaryColor: string;
  badgeBg: string;
  accentHex: string;
}

export const THEMES: ThemeConfig[] = [
  { id: "rose",     name: "Relief Crimson",  primaryColor: "bg-rose-600 hover:bg-rose-700",    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",     accentHex: "#e11d48" },
  { id: "ocean",    name: "Ocean Blue",      primaryColor: "bg-blue-600 hover:bg-blue-700",    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",       accentHex: "#2563eb" },
  { id: "emerald",  name: "Emerald Forest",  primaryColor: "bg-emerald-600 hover:bg-emerald-700", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200", accentHex: "#059669" },
  { id: "dark",     name: "Midnight Dark",   primaryColor: "bg-slate-900 hover:bg-slate-800",  badgeBg: "bg-slate-800 text-slate-100 border-slate-700",   accentHex: "#0f172a" },
  { id: "sunset",   name: "Tactical Amber",  primaryColor: "bg-amber-600 hover:bg-amber-700",  badgeBg: "bg-amber-50 text-amber-700 border-amber-200",    accentHex: "#d97706" },
  { id: "amethyst", name: "Amethyst Royal",  primaryColor: "bg-purple-600 hover:bg-purple-700", badgeBg: "bg-purple-50 text-purple-700 border-purple-200",   accentHex: "#9333ea" },
];

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  config: ThemeConfig;
}

const getInitialTheme = (): ThemeType => {
  const saved = localStorage.getItem("reliefgrid_theme") as ThemeType;
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  return "rose";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  config: THEMES.find((t) => t.id === getInitialTheme()) || THEMES[0],
  setTheme: (newTheme: ThemeType) => {
    localStorage.setItem("reliefgrid_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({
      theme: newTheme,
      config: THEMES.find((t) => t.id === newTheme) || THEMES[0],
    });
  },
}));

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeColor = "amber" | "blue" | "green" | "purple" | "rose";

interface ThemePreset {
  id: ThemeColor;
  label: string;
  primary: string;
  primaryForeground: string;
  ring: string;
  hex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "amber",
    label: "Âmbar",
    primary: "38 92% 50%",
    primaryForeground: "222 47% 11%",
    ring: "38 92% 50%",
    hex: "#f59e0b",
  },
  {
    id: "blue",
    label: "Azul",
    primary: "214 100% 58%",
    primaryForeground: "222 47% 11%",
    ring: "214 100% 58%",
    hex: "#3b82f6",
  },
  {
    id: "green",
    label: "Verde",
    primary: "142 71% 45%",
    primaryForeground: "222 47% 11%",
    ring: "142 71% 45%",
    hex: "#22c55e",
  },
  {
    id: "purple",
    label: "Roxo",
    primary: "262 83% 65%",
    primaryForeground: "222 47% 11%",
    ring: "262 83% 65%",
    hex: "#a855f7",
  },
  {
    id: "rose",
    label: "Rosa",
    primary: "336 80% 58%",
    primaryForeground: "222 47% 11%",
    ring: "336 80% 58%",
    hex: "#f43f5e",
  },
];

const STORAGE_KEY = "babywatch-theme-color";

interface ThemeContextValue {
  color: ThemeColor;
  setColor: (c: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  color: "amber",
  setColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeColor) ?? "amber";
  });

  const setColor = (c: ThemeColor) => {
    setColorState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  useEffect(() => {
    const preset = THEME_PRESETS.find((p) => p.id === color);
    if (!preset) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--primary-foreground", preset.primaryForeground);
    root.style.setProperty("--ring", preset.ring);
    root.style.setProperty("--sidebar-primary", preset.primary);
    root.style.setProperty("--sidebar-ring", preset.ring);
  }, [color]);

  return (
    <ThemeContext.Provider value={{ color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

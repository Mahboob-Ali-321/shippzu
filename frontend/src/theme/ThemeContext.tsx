import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";
import { getColors, ThemeColors, ThemeMode } from "./tokens";

type ThemeCtx = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);
const KEY = "shippzu.theme.mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>((system as ThemeMode) || "light");

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>(KEY, "");
      if (saved === "light" || saved === "dark") setModeState(saved);
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void storage.setItem(KEY, m);
  }, []);
  const toggle = useCallback(() => setMode(mode === "light" ? "dark" : "light"), [mode, setMode]);

  const value = useMemo<ThemeCtx>(
    () => ({ mode, colors: getColors(mode), isDark: mode === "dark", setMode, toggle }),
    [mode, setMode, toggle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

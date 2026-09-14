import React, { createContext, useContext, useEffect, useState } from "react";
import { readFontSize, readFontStyle } from "@/lib/font-settings";

type Theme = "light" | "dark";
export type FontSize = "small" | "medium" | "large";
export type FontStyle = "cute" | "formal";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  fontSize: FontSize;
  fontStyle: FontStyle;
  setFontSize: (size: FontSize) => void;
  setFontStyle: (style: FontStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => readFontSize(localStorage.getItem("font-size")));
  const [fontStyle, setFontStyle] = useState<FontStyle>(() => readFontStyle(localStorage.getItem("font-style")));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = fontSize;
    root.dataset.fontStyle = fontStyle;
    localStorage.setItem("font-size", fontSize);
    localStorage.setItem("font-style", fontStyle);
  }, [fontSize, fontStyle]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, fontSize, fontStyle, setFontSize, setFontStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

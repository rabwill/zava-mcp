import { useMemo } from "react";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const lightColors: ThemeColors = {
  background: "#ffffff",
  surface: "#f5f5f5",
  surfaceHover: "#e8e8e8",
  text: "#242424",
  textSecondary: "#616161",
  border: "#e0e0e0",
  primary: "#0078d4",
  primaryText: "#ffffff",
  success: "#107c10",
  warning: "#ffb900",
  error: "#d13438",
  info: "#0078d4",
};

const darkColors: ThemeColors = {
  background: "#1e1e1e",
  surface: "#2d2d2d",
  surfaceHover: "#3a3a3a",
  text: "#e0e0e0",
  textSecondary: "#a0a0a0",
  border: "#404040",
  primary: "#4db8ff",
  primaryText: "#1e1e1e",
  success: "#6ccb5f",
  warning: "#fce100",
  error: "#ff6b6b",
  info: "#4db8ff",
};

export function useThemeColors(): ThemeColors {
  return useMemo(() => {
    const theme = window.openai?.theme;
    return theme === "dark" ? darkColors : lightColors;
  }, []);
}

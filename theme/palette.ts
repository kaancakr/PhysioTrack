import { type ThemeColors, type ThemeMode } from "@/types/domain";

const LIGHT_THEME: ThemeColors = {
  accent: "#aec3b0",
  accentContrast: "#FFFFFF",
  accentSoft: "#709775",
  background: "#ffffff",
  border: "#D7E0F0",
  card: "#FFFFFF",
  danger: "#DB5D67",
  success: "#2FC58D",
  surfaceMuted: "#F2F3F5",
  textMuted: "#8790A4",
  textPrimary: "#1C1E21",
  textSecondary: "#5C667B",
};

const DARK_THEME: ThemeColors = {
  accent: "#aec3b0",
  accentContrast: "#081120",
  accentSoft: "#aec3b0",
  background: "#5f7470",
  border: "#22314A",
  card: "#709775",
  danger: "#FF8D9A",
  success: "#72E2B2",
  surfaceMuted: "#202B3F",
  textMuted: "#90A0BC",
  textPrimary: "#F7F9FE",
  textSecondary: "#C8D3E5",
};

export function getThemeColors(mode: ThemeMode) {
  if (mode === "dark") {
    return DARK_THEME;
  }

  return LIGHT_THEME;
}

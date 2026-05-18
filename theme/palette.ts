import { type ThemeColors, type ThemeMode } from "@/types/domain";

const LIGHT_THEME: ThemeColors = {
  accent: "#4EAF63",
  accentContrast: "#FFFFFF",
  accentSoft: "#A7D7B1",
  background: "#FAFAFA",
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
  accent: "#6FD08C",
  accentContrast: "#0D1B14",
  accentSoft: "#8FCF9D",
  background: "#0F1714",
  border: "#22352D",
  card: "#16211D",
  danger: "#FF8F97",
  success: "#63D7A0",
  surfaceMuted: "#1C2A25",
  textMuted: "#8EA59A",
  textPrimary: "#F4FBF7",
  textSecondary: "#C7D8D0",
};

export function getThemeColors(mode: ThemeMode) {
  if (mode === "dark") {
    return DARK_THEME;
  }

  return LIGHT_THEME;
}

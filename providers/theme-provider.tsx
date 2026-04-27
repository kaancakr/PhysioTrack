import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { readThemePreference, writeThemePreference } from "@/lib/storage";
import { getThemeColors } from "@/theme/palette";
import { type ThemeMode, type ThemePreference } from "@/types/domain";

type ThemeContextValue = {
  colors: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ReturnType<typeof useColorScheme>,
) {
  if (preference === "light") {
    return "light" satisfies ThemeMode;
  }

  if (preference === "dark") {
    return "dark" satisfies ThemeMode;
  }

  return systemScheme === "dark" ? ("dark" satisfies ThemeMode) : ("light" satisfies ThemeMode);
}

export function ThemeProvider(props: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const mode = resolveThemeMode(preference, systemScheme);
  const colors = getThemeColors(mode);

  useEffect(() => {
    const loadPreference = async () => {
      const storedPreference = await readThemePreference();

      if (storedPreference !== null) {
        setPreferenceState(storedPreference);
      }
    };

    void loadPreference();
  }, []);

  const setPreference = async (nextPreference: ThemePreference) => {
    await writeThemePreference(nextPreference);
    setPreferenceState(nextPreference);
  };

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark: mode === "dark",
        mode,
        preference,
        setPreference,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useAppTheme must be used inside ThemeProvider.");
  }

  return context;
}

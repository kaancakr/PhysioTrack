import { Stack } from "expo-router";

import { useAppTheme } from "@/providers/theme-provider";

export default function ProfileLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}

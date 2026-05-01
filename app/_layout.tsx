import "react-native-url-polyfill/auto";
import "../lib/i18n";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { ProgressProvider } from "@/providers/progress-provider";
import { SessionProvider, useSession } from "@/providers/session-provider";
import { ThemeProvider, useAppTheme } from "@/providers/theme-provider";

function NavigationGate() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, isLoading, isOnboardingComplete } = useSession();

  const topSegment = segments[0];

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = topSegment === "(auth)";
    const isTabRoute = topSegment === "(tabs)";
    const isOnboardingRoute = topSegment === "onboarding";
    const isExerciseRoute = topSegment === "exercise";
    const isSessionRoute = topSegment === "session";

    const isProtectedAppRoute = isTabRoute || isExerciseRoute || isSessionRoute;

    if (currentUserId === null && !isAuthRoute) {
      router.replace("/(auth)/welcome");
      return;
    }

    if (currentUserId !== null && !isOnboardingComplete && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }

    if (currentUserId !== null && isOnboardingComplete && isOnboardingRoute) {
      router.replace("/(tabs)/dashboard");
      return;
    }

    if (
      currentUserId !== null &&
      isOnboardingComplete &&
      !isProtectedAppRoute &&
      !isOnboardingRoute
    ) {
      router.replace("/(tabs)/dashboard");
    }
  }, [currentUserId, isLoading, isOnboardingComplete, router, topSegment]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ProgressProvider>
          <NavigationGate />
        </ProgressProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

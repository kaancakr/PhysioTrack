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
  const {
    currentUserId,
    hasCompletedGuestOnboarding,
    isFirstAppLaunch,
    isLoading,
    isOnboardingComplete,
    isReturningUserWelcomeRedirectEnabled,
    pendingSignupEmail,
  } = useSession();

  const topSegment = segments[0];

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = topSegment === "(auth)";
    const isTabRoute = topSegment === "(tabs)";
    const isOnboardingRoute = topSegment === "onboarding";
    const authSubRoute = segments[1];
    const isLoginRoute = isAuthRoute && authSubRoute === "login";
    const isVerifyEmailRoute = isAuthRoute && authSubRoute === "verify-email";

    const isProtectedAppRoute = isTabRoute;
    const shouldRedirectSignedOutUserToWelcome =
      isReturningUserWelcomeRedirectEnabled && !isFirstAppLaunch;

    if (currentUserId === null) {
      if (isVerifyEmailRoute && pendingSignupEmail === null) {
        router.replace("/(auth)/signup");
      } else if (
        shouldRedirectSignedOutUserToWelcome &&
        !isAuthRoute
      ) {
        router.replace("/(auth)/welcome");
      } else if (
        !shouldRedirectSignedOutUserToWelcome &&
        !hasCompletedGuestOnboarding &&
        !isOnboardingRoute &&
        !isLoginRoute
      ) {
        router.replace("/onboarding");
      } else if (hasCompletedGuestOnboarding && !isAuthRoute) {
        router.replace("/(auth)/welcome");
      }
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
  }, [
    currentUserId,
    isLoading,
    isFirstAppLaunch,
    isOnboardingComplete,
    hasCompletedGuestOnboarding,
    isReturningUserWelcomeRedirectEnabled,
    router,
    pendingSignupEmail,
    segments,
    topSegment,
  ]);

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

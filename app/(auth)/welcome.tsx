import * as AppleAuthentication from "expo-apple-authentication";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppleAuthButton } from "@/components/apple-auth-button";
import { AppButton } from "@/components/app-button";
import { ArtworkPanel } from "@/components/artwork-panel";
import { useAppTheme } from "@/providers/theme-provider";

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const [appleAuthError, setAppleAuthError] = useState<string | null>(null);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Home physiotherapy, guided clearly
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Build a gentle daily routine you can actually stick with.
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            PyhsioTrack helps patients follow no-equipment exercise programs with
            clear steps, timers, and progress tracking.
          </Text>
        </View>

        <ArtworkPanel
          illustration={{
            icon: "body",
            background: colors.accentSoft,
            tint: colors.accent,
          }}
          title="Move with confidence"
          subtitle="Follow each exercise step with calm pacing, visible progress, and practical guidance."
        />

        <View style={styles.actions}>
          <AppleAuthButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            onError={setAppleAuthError}
          />
          {appleAuthError !== null ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {appleAuthError}
            </Text>
          ) : null}
          <Link asChild href="/(auth)/signup">
            <AppButton label="Create account" />
          </Link>
          <Link asChild href="/(auth)/login">
            <AppButton label="I already have an account" variant="secondary" />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 20,
  },
  hero: {
    gap: 16,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
});

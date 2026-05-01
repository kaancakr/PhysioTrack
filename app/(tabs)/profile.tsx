import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { useProgress } from "@/providers/progress-provider";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type ThemePreference } from "@/types/domain";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { completedSessions } = useProgress();
  const { configurationError, isTestingBypassEnabled, profile, signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const totalDurationSec = completedSessions.reduce(
    (sum, item) => sum + item.completedDurationSec,
    0,
  );

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            {
              gap: metrics.sectionGap,
              maxWidth: metrics.contentMaxWidth,
            },
          ]}
        >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Profile & settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Adjust your theme, review your activity, and manage your account.
          </Text>
        </View>

        <AppCard>
          <View style={[styles.cardSection, { gap: metrics.panelGap }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {profile?.fullName ?? "Patient"}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              {profile?.email ?? "Signed in account"}
            </Text>
            {isTestingBypassEnabled ? (
              <Text style={[styles.warningText, { color: colors.accent }]}>
                Auth bypass is enabled for local testing.
              </Text>
            ) : null}
            {configurationError !== null ? (
              <Text style={[styles.warningText, { color: colors.danger }]}>
                {configurationError}
              </Text>
            ) : null}
          </View>
        </AppCard>

        <AppCard>
          <View style={[styles.cardSection, { gap: metrics.panelGap }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Appearance</Text>
            <View style={[styles.themeOptions, width < 420 ? styles.themeOptionsColumn : null]}>
              {THEME_OPTIONS.map((option) => {
                const isSelected = option.value === preference;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      void setPreference(option.value);
                    }}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: isSelected ? colors.accentSoft : colors.surfaceMuted,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeOptionLabel,
                        { color: isSelected ? colors.accent : colors.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </AppCard>

        <AppCard>
          <View style={[styles.cardSection, { gap: metrics.panelGap }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Your progress</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Completed sessions: {completedSessions.length}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Total guided time: {formatDuration(totalDurationSec)}
            </Text>
          </View>
        </AppCard>

        <AppButton
          disabled={isSigningOut}
          label={isSigningOut ? "Signing out..." : "Sign out"}
          onPress={handleSignOut}
          variant="secondary"
        />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 12,
  },
  content: {
    alignSelf: "center",
    width: "100%",
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardSection: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 10,
  },
  themeOptionsColumn: {
    flexDirection: "column",
  },
  themeOption: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppBackButton } from "@/components/app-back-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

function parsePositiveInteger(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === undefined) {
    return 0;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function parseRouteString(value: string | string[] | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null;
  }

  return rawValue;
}

export default function ExerciseCompletedScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { intakeProfile, profile } = useSession();
  const params = useLocalSearchParams<{
    durationSec?: string;
    exerciseId: string;
    exerciseTitle?: string;
    programId: string;
    programTitle?: string;
    stepCount?: string;
  }>();
  const completedDurationSec = parsePositiveInteger(params.durationSec);
  const completedStepCount = parsePositiveInteger(params.stepCount);
  const patientName = intakeProfile?.fullName ?? profile?.fullName ?? "You";
  const exerciseTitle = parseRouteString(params.exerciseTitle) ?? "your exercise";
  const programTitle = parseRouteString(params.programTitle) ?? "Exercise program";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppBackButton
          label="Back to exercise"
          onPress={() =>
            router.replace(
              `/programs/${params.programId}/exercises/${params.exerciseId}`,
            )
          }
        />

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.accentSoft,
            },
          ]}
        >
          <View
            style={[
              styles.celebrationBadge,
              {
                backgroundColor: colors.accent,
              },
            ]}
          >
            <Ionicons color={colors.accentContrast} name="sparkles" size={22} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Exercise complete
          </Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Nice work, {patientName}.
          </Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            You finished {exerciseTitle.toLowerCase()} inside {programTitle.toLowerCase()}.
          </Text>
        </View>

        <ArtworkPanel
          illustration={{
            background: colors.accentSoft,
            icon: "sparkles",
            tint: colors.accent,
          }}
          subtitle={programTitle}
          title={exerciseTitle}
        />

        <View style={styles.metricsRow}>
          <AppCard style={styles.metricCard}>
            <View
              style={[
                styles.metricContent,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.accent }]}>
                {formatDuration(completedDurationSec)}
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Total duration
              </Text>
            </View>
          </AppCard>
          <AppCard style={styles.metricCard}>
            <View
              style={[
                styles.metricContent,
                { backgroundColor: "rgba(47, 197, 141, 0.18)" },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {completedStepCount}
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Steps completed
              </Text>
            </View>
          </AppCard>
        </View>

        <View style={styles.actions}>
          <Link asChild href="/programs">
            <AppButton label="Back to programs" />
          </Link>
          <Link
            asChild
            href={`/programs/${params.programId}/exercises/${params.exerciseId}`}
          >
            <AppButton label="Review exercise" variant="secondary" />
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
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heroCard: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  celebrationBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    textAlign: "center",
  },
  heroText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
  },
  metricContent: {
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});

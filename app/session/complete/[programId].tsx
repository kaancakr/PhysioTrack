import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { EXERCISE_PROGRAMS } from "@/data/exercise-programs";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

function parsePositiveInteger(value: string | string[] | undefined) {
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

export default function SessionCompleteScreen() {
  const { colors } = useAppTheme();
  const { intakeProfile, profile } = useSession();
  const params = useLocalSearchParams<{
    durationSec?: string;
    programId: string;
    stepCount?: string;
  }>();
  const program =
    EXERCISE_PROGRAMS.find((item) => item.id === params.programId) ?? null;
  const completedDurationSec = parsePositiveInteger(params.durationSec);
  const completedStepCount = parsePositiveInteger(params.stepCount);
  const patientName = intakeProfile?.fullName ?? profile?.fullName ?? "You";

  if (program === null) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Celebration unavailable
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            We could not load the finished session summary.
          </Text>
          <Link asChild href="/(tabs)/dashboard">
            <AppButton label="Return home" />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            Session complete
          </Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Nice work, {patientName}.
          </Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            You finished {program.title.toLowerCase()} and added another
            positive rehab session to your routine.
          </Text>
        </View>

        <ArtworkPanel
          illustration={program.coverImage}
          subtitle={`${program.focusAreaLabel} • ${program.difficultyLabel}`}
          title={program.title}
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
                Time completed
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
                Steps finished
              </Text>
            </View>
          </AppCard>
        </View>

        <AppCard>
          <View style={styles.messagePanel}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
              Keep the momentum going
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Short, consistent sessions build better comfort and confidence
              than pushing through everything at once.
            </Text>
            <View style={styles.tipRow}>
              <Ionicons color={colors.accent} name="heart-circle" size={22} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Revisit this program anytime or explore another no-equipment
                routine.
              </Text>
            </View>
          </View>
        </AppCard>

        <View style={styles.actions}>
          <Link asChild href="/(tabs)/dashboard">
            <AppButton label="Back to dashboard" />
          </Link>
          <Link asChild href="/(tabs)/exercises">
            <AppButton label="More exercises" variant="secondary" />
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
  messagePanel: {
    gap: 12,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  panelText: {
    fontSize: 15,
    lineHeight: 23,
  },
  tipRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});

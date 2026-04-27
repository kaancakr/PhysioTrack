import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { EXERCISE_PROGRAMS } from "@/data/exercise-programs";
import { useProgress } from "@/providers/progress-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

export default function ExerciseDetailScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ programId: string }>();
  const { activeSession, restartSession } = useProgress();
  const program = EXERCISE_PROGRAMS.find((item) => item.id === params.programId) ?? null;
  const hasActiveSession = activeSession?.programId === program?.id;

  const handleResume = () => {
    if (program === null) {
      return;
    }

    router.push(`/session/${program.id}`);
  };

  const handleStartFromBeginning = async () => {
    if (program === null) {
      return;
    }

    await restartSession(program.id);
    router.push(`/session/${program.id}`);
  };

  if (program === null) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Program not found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            This exercise program could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ArtworkPanel
          illustration={program.coverImage}
          subtitle={`${program.focusAreaLabel} • ${program.difficultyLabel} • ${formatDuration(program.totalDurationSec)}`}
          title={program.title}
        />

        <AppCard>
          <View style={styles.summary}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Program overview</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {program.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons color={colors.accent} name="timer-outline" size={18} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {formatDuration(program.totalDurationSec)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons color={colors.accent} name="list-outline" size={18} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {program.steps.length} steps
                </Text>
              </View>
            </View>
          </View>
        </AppCard>

        <View style={styles.stepList}>
          {program.steps.map((step, index) => (
            <AppCard key={step.id}>
              <View style={styles.stepCard}>
                <Text style={[styles.stepLabel, { color: colors.accent }]}>Step {index + 1}</Text>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
                <Text style={[styles.stepInstruction, { color: colors.textSecondary }]}>
                  {step.instruction}
                </Text>
                <Text style={[styles.stepMeta, { color: colors.textMuted }]}>
                  {formatDuration(step.durationSec)} • {step.cautionNote}
                </Text>
              </View>
            </AppCard>
          ))}
        </View>

        <AppCard>
          <View style={styles.actionPanel}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Ready to begin?
            </Text>
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              Start a guided session from step one, or jump back into your saved progress.
            </Text>
            <View style={styles.actionButtons}>
              {hasActiveSession ? (
                <AppButton
                  label="Resume session"
                  onPress={() => {
                    handleResume();
                  }}
                />
              ) : null}
              <AppButton
                label={hasActiveSession ? "Start from beginning" : "Start guided session"}
                onPress={() => {
                  void handleStartFromBeginning();
                }}
                variant={hasActiveSession ? "secondary" : "primary"}
              />
            </View>
          </View>
        </AppCard>
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
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  summary: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    gap: 18,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    gap: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  stepInstruction: {
    fontSize: 14,
    lineHeight: 22,
  },
  stepMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionPanel: {
    gap: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  actionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
});

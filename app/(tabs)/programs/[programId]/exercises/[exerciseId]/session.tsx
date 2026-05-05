import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppBackButton } from "@/components/app-back-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { getAuthErrorMessage, requestAuthJson } from "@/lib/auth";
import {
  parseExerciseDetailPayload,
  parseExerciseStepCompletionPayload,
  type ExerciseDetail,
} from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

function clampProgress(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function getStepStatusIconName(
  stepIndex: number,
  currentStepIndex: number,
  isPaused: boolean,
  isStepComplete: boolean,
): keyof typeof Ionicons.glyphMap {
  if (stepIndex < currentStepIndex) {
    return "checkmark-circle";
  }

  if (stepIndex === currentStepIndex && isStepComplete) {
    return "checkmark-circle";
  }

  if (stepIndex === currentStepIndex) {
    return isPaused ? "pause-circle" : "play-circle";
  }

  return "ellipse-outline";
}

function getCurrentStepIndex(exercise: ExerciseDetail): number {
  if (exercise.progress.nextStepIndex !== null) {
    return Math.min(
      exercise.progress.nextStepIndex,
      Math.max(exercise.steps.length - 1, 0),
    );
  }

  return Math.min(
    exercise.progress.completedStepsCount,
    Math.max(exercise.steps.length - 1, 0),
  );
}

export default function ExerciseSessionScreen() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const router = useRouter();
  const params = useLocalSearchParams<{
    exerciseId: string;
    programId: string;
  }>();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedStepSec, setElapsedStepSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExerciseDetail = useCallback(
    async (programId: string, exerciseId: string) => {
      const path = `/api/auth/programs/${programId}/exercises/${exerciseId}/`;
      const payload = await requestAuthJson<unknown>(path, {
        method: "GET",
      });

      return parseExerciseDetailPayload(payload, programId, exerciseId);
    },
    [],
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadExerciseSession = async () => {
      if (
        typeof params.programId !== "string" ||
        typeof params.exerciseId !== "string"
      ) {
        setExercise(null);
        setErrorMessage("This session could not be identified.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextExercise = await loadExerciseDetail(
          params.programId,
          params.exerciseId,
        );

        setExercise(nextExercise);
        setElapsedStepSec(0);
        setIsPaused(false);
      } catch (error) {
        setExercise(null);
        setErrorMessage(
          getAuthErrorMessage(error, "This session could not be loaded."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadExerciseSession();
  }, [isFocused, loadExerciseDetail, params.exerciseId, params.programId]);

  useEffect(() => {
    if (isLoading || exercise === null || exercise.progress.isFinished || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedStepSec((currentValue) => currentValue + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [exercise, isLoading, isPaused]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (exercise === null) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Session unavailable
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {errorMessage ?? "This exercise session could not be loaded."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exercise.steps.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No steps available
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            This exercise does not have any steps to guide yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIndex = getCurrentStepIndex(exercise);
  const currentStep = exercise.steps[currentStepIndex];
  const currentStepDurationSec = Math.max(currentStep.durationSec, 1);
  const completedRatio = clampProgress(elapsedStepSec / currentStepDurationSec);
  const isCurrentStepComplete = elapsedStepSec >= currentStepDurationSec;
  const remainingSteps = Math.max(exercise.steps.length - currentStepIndex - 1, 0);
  const currentStatusLabel = exercise.progress.isFinished
    ? "Finished"
    : isCurrentStepComplete
      ? "Ready to complete"
      : isPaused
        ? "Paused"
        : "In progress";
  const currentStatusIconName = exercise.progress.isFinished
    ? "checkmark-circle"
    : isCurrentStepComplete
      ? "checkmark-circle"
      : isPaused
        ? "pause-circle"
        : "play-circle";

  const reloadExercise = async (): Promise<ExerciseDetail> => {
    const nextExercise = await loadExerciseDetail(
      exercise.programId,
      exercise.id,
    );

    setExercise(nextExercise);
    setElapsedStepSec(0);
    setIsPaused(false);

    return nextExercise;
  };

  const goToCompletedScreen = (nextExercise: ExerciseDetail) => {
    router.replace(
      `/programs/${nextExercise.programId}/exercises/${nextExercise.id}/completed?exerciseTitle=${encodeURIComponent(nextExercise.title)}&programTitle=${encodeURIComponent(nextExercise.programTitle)}&durationSec=${nextExercise.totalDurationSec}&stepCount=${nextExercise.progress.stepsCount}`,
    );
  };

  const completeCurrentStep = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const completionPath = `/api/auth/programs/${exercise.programId}/exercises/${exercise.id}/steps/${currentStepIndex}/complete/`;
      const completionResponse = parseExerciseStepCompletionPayload(
        await requestAuthJson<unknown>(completionPath, {
          method: "POST",
        }),
      );
      const nextExercise = await reloadExercise();

      if (
        completionResponse.isFinished ||
        completionResponse.nextStepIndex === null ||
        nextExercise.progress.isFinished
      ) {
        goToCompletedScreen(nextExercise);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionLabel, { color: colors.accent }]}>
            Guided session
          </Text>
          <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>
            {exercise.title}
          </Text>
          <Text style={[styles.sessionCopy, { color: colors.textSecondary }]}>
            Complete only the next allowed step. Progress is saved by the backend
            in strict sequence.
          </Text>
        </View>

        <ArtworkPanel
          illustration={exercise.illustration}
          subtitle={`Step ${currentStepIndex + 1} of ${exercise.steps.length} • ${remainingSteps} remaining`}
          title={currentStep.title}
        />

        <AppCard>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                  Current step timer
                </Text>
                <Text style={[styles.timerValue, { color: colors.textPrimary }]}>
                  {formatDuration(elapsedStepSec)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      isCurrentStepComplete || exercise.progress.isFinished
                        ? colors.success
                        : colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  color={
                    isCurrentStepComplete || exercise.progress.isFinished
                      ? colors.accentContrast
                      : colors.textPrimary
                  }
                  name={currentStatusIconName}
                  size={18}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        isCurrentStepComplete || exercise.progress.isFinished
                          ? colors.accentContrast
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {currentStatusLabel}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${completedRatio * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.timerHint, { color: colors.textMuted }]}>
              Suggested step length: {formatDuration(currentStepDurationSec)}
            </Text>
            <Text style={[styles.stepSupportText, { color: colors.textSecondary }]}>
              Completed steps: {exercise.progress.completedStepsCount}/
              {exercise.progress.stepsCount}
            </Text>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.stepTrackerSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Session steps
            </Text>
            <View style={styles.stepTrackerList}>
              {exercise.steps.map((step, stepIndex) => {
                const isStepActive = stepIndex === currentStepIndex;
                const isStepDone = exercise.progress.completedStepIndexes.includes(
                  stepIndex,
                );
                const iconName = getStepStatusIconName(
                  stepIndex,
                  currentStepIndex,
                  isPaused,
                  isCurrentStepComplete,
                );

                return (
                  <View
                    key={step.id}
                    style={[
                      styles.stepTrackerItem,
                      {
                        backgroundColor: isStepActive
                          ? colors.surfaceMuted
                          : "transparent",
                        borderColor: isStepActive ? colors.accentSoft : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.stepTrackerMeta}>
                      <Ionicons
                        color={
                          isStepDone
                            ? colors.success
                            : isStepActive
                              ? colors.accent
                              : colors.textMuted
                        }
                        name={iconName}
                        size={22}
                      />
                      <View style={styles.stepTrackerTextGroup}>
                        <Text
                          style={[styles.stepTrackerTitle, { color: colors.textPrimary }]}
                        >
                          {stepIndex + 1}. {step.title}
                        </Text>
                        <Text
                          style={[
                            styles.stepTrackerSubtitle,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {isStepDone
                            ? "Completed"
                            : stepIndex === currentStepIndex
                              ? "Current required step"
                              : "Locked until previous steps are done"}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.stepTrackerDuration, { color: colors.textMuted }]}
                    >
                      {formatDuration(step.durationSec)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.instructionSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Guidance
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              {currentStep.instruction}
            </Text>
            <Text style={[styles.cautionText, { color: colors.textMuted }]}>
              {currentStep.cautionNote}
            </Text>
          </View>
        </AppCard>

        <View style={styles.actionGroup}>
          <AppButton
            label={isPaused ? "Resume timer" : "Pause timer"}
            onPress={() => {
              setIsPaused((currentValue) => !currentValue);
            }}
            variant="secondary"
          />
          <AppButton
            disabled={isSubmitting || exercise.progress.isFinished}
            label={isCurrentStepComplete ? "Complete step" : "Mark step done"}
            onPress={() => {
              if (!isCurrentStepComplete) {
                setElapsedStepSec(currentStepDurationSec);
                return;
              }

              void completeCurrentStep();
            }}
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
  sessionHeader: {
    gap: 8,
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sessionTitle: {
    fontSize: 30,
    fontWeight: "800",
  },
  sessionCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressSection: {
    gap: 14,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  timerValue: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 6,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  timerHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepSupportText: {
    fontSize: 14,
    lineHeight: 21,
  },
  stepTrackerSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  stepTrackerList: {
    gap: 10,
  },
  stepTrackerItem: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepTrackerMeta: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  stepTrackerTextGroup: {
    flex: 1,
    gap: 4,
  },
  stepTrackerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  stepTrackerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepTrackerDuration: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 12,
  },
  instructionSection: {
    gap: 12,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 23,
  },
  cautionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionGroup: {
    gap: 12,
  },
});

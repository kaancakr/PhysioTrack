import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  type ExerciseDetail,
} from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

function buildProgressCopy(exercise: ExerciseDetail): string {
  if (exercise.progress.isFinished) {
    return "Finished";
  }

  if (exercise.progress.nextStepIndex !== null) {
    return `Next required step ${exercise.progress.nextStepIndex + 1}`;
  }

  return `${exercise.progress.completedStepsCount}/${exercise.progress.stepsCount} steps complete`;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function getInitialPreviewStepIndex(exercise: ExerciseDetail): number {
  if (exercise.progress.nextStepIndex !== null) {
    return Math.min(
      exercise.progress.nextStepIndex,
      Math.max(exercise.steps.length - 1, 0),
    );
  }

  return 0;
}

export default function ExerciseDetailScreen() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const router = useRouter();
  const params = useLocalSearchParams<{
    exerciseId: string;
    programId: string;
  }>();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadExercise = async () => {
      if (
        typeof params.programId !== "string" ||
        typeof params.exerciseId !== "string"
      ) {
        setErrorMessage("This exercise could not be identified.");
        setExercise(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const path = `/api/auth/programs/${params.programId}/exercises/${params.exerciseId}/`;
        const payload = await requestAuthJson<unknown>(path, {
          method: "GET",
        });
        const nextExercise = parseExerciseDetailPayload(
          payload,
          params.programId,
          params.exerciseId,
        );
        setExercise(nextExercise);
        setPreviewStepIndex(getInitialPreviewStepIndex(nextExercise));
      } catch (error) {
        setExercise(null);
        setErrorMessage(
          getAuthErrorMessage(error, "This exercise could not be loaded."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadExercise();
  }, [isFocused, params.exerciseId, params.programId]);

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
            Exercise unavailable
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {errorMessage ?? "This exercise could not be loaded."}
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
            This exercise does not have any visual movement steps yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const prescription =
    exercise.metadata.timing.prescription ??
    [exercise.metadata.timing.repetitions, exercise.metadata.timing.sets]
      .filter((value): value is string => value !== null)
      .join(" • ");
  const currentStep = exercise.steps[previewStepIndex];
  const isCompleted = exercise.progress.completedStepIndexes.includes(
    currentStep.stepIndex,
  );
  const isNextRequiredStep = exercise.progress.nextStepIndex === currentStep.stepIndex;
  const currentImageSource =
    currentStep.image.url ?? currentStep.image.thumbnailUrl;

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
          label="Back to program"
          onPress={() => router.replace(`/programs/${params.programId}`)}
        />

        <ArtworkPanel
          illustration={exercise.illustration}
          subtitle={`${exercise.programTitle} • ${formatDuration(exercise.totalDurationSec)} • ${buildProgressCopy(exercise)}`}
          title={exercise.title}
        />

        <AppCard>
          <View style={styles.summary}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Exercise overview
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {exercise.description ??
                "Move through the steps in order and review each movement before starting the guided timer."}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {exercise.bodyArea ?? "general"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {exercise.progress.completedStepsCount}/
                  {exercise.progress.stepsCount} steps
                </Text>
              </View>
              {prescription.length > 0 ? (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {prescription}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.summary}>
            <View style={styles.stepPreviewHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Movement step
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Step {previewStepIndex + 1} of {exercise.steps.length}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepState,
                  {
                    color: isCompleted
                      ? colors.success
                      : isNextRequiredStep
                        ? colors.accent
                        : colors.textMuted,
                  },
                ]}
              >
                {isCompleted ? "Completed" : isNextRequiredStep ? "Next" : "Preview"}
              </Text>
            </View>

            <View
              style={[
                styles.stepImageFrame,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              {currentImageSource !== null ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: currentImageSource }}
                  style={styles.stepImage}
                />
              ) : (
                <View style={styles.stepImagePlaceholder}>
                  <Text
                    style={[styles.placeholderTitle, { color: colors.textPrimary }]}
                  >
                    Step visual coming soon
                  </Text>
                  <Text
                    style={[styles.placeholderText, { color: colors.textSecondary }]}
                  >
                    {currentStep.image.alt ?? currentStep.instruction}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                {currentStep.title}
              </Text>
              <Text
                style={[styles.stepInstruction, { color: colors.textSecondary }]}
              >
                {currentStep.instruction}
              </Text>
              <Text style={[styles.stepMeta, { color: colors.textMuted }]}>
                {formatDuration(currentStep.durationSec)}
              </Text>
            </View>

            <View style={styles.stepNavigation}>
              <AppButton
                disabled={previewStepIndex === 0}
                label="Previous step"
                onPress={() => {
                  setPreviewStepIndex((currentValue) => {
                    return Math.max(currentValue - 1, 0);
                  });
                }}
                variant="secondary"
              />
              <AppButton
                disabled={previewStepIndex >= exercise.steps.length - 1}
                label="Next step"
                onPress={() => {
                  setPreviewStepIndex((currentValue) => {
                    return Math.min(currentValue + 1, exercise.steps.length - 1);
                  });
                }}
                variant="secondary"
              />
            </View>
          </View>
        </AppCard>

        {exercise.metadata.safetyFlags.length > 0 ? (
          <AppCard>
            <View style={styles.summary}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Safety notes
              </Text>
              <View style={styles.tagList}>
                {exercise.metadata.safetyFlags.map((flag) => (
                  <View
                    key={flag}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                      {flag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </AppCard>
        ) : null}

        {exercise.metadata.equipment.length > 0 ||
        exercise.metadata.primaryTargets.length > 0 ||
        exercise.metadata.therapeuticGoals.length > 0 ||
        exercise.metadata.movementType !== null ? (
          <AppCard>
            <View style={styles.summary}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Therapy details
              </Text>
              {exercise.metadata.movementType !== null ? (
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Movement type: {formatLabel(exercise.metadata.movementType)}
                </Text>
              ) : null}
              {exercise.metadata.equipment.length > 0 ? (
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Equipment: {exercise.metadata.equipment.map(formatLabel).join(", ")}
                </Text>
              ) : null}
              {exercise.metadata.primaryTargets.length > 0 ? (
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Primary targets:{" "}
                  {exercise.metadata.primaryTargets.map(formatLabel).join(", ")}
                </Text>
              ) : null}
              {exercise.metadata.therapeuticGoals.length > 0 ? (
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Therapeutic goals:{" "}
                  {exercise.metadata.therapeuticGoals
                    .map(formatLabel)
                    .join(", ")}
                </Text>
              ) : null}
            </View>
          </AppCard>
        ) : null}

        <AppCard>
          <View style={styles.actionPanel}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Guided completion
            </Text>
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              Start the timed guided flow to progress automatically through the
              next required movement step, or preview steps manually here first.
            </Text>
            <AppButton
              label={
                exercise.progress.isFinished
                  ? "Repeat exercise"
                  : "Open guided session"
              }
              onPress={() => {
                router.push(
                  `/programs/${exercise.programId}/exercises/${exercise.id}/session`,
                );
              }}
            />
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
    flexWrap: "wrap",
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
    textTransform: "capitalize",
  },
  stepPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepState: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepImageFrame: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 240,
    overflow: "hidden",
  },
  stepImage: {
    height: 240,
    width: "100%",
  },
  stepImagePlaceholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 240,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  stepContent: {
    gap: 8,
  },
  stepNavigation: {
    flexDirection: "row",
    gap: 12,
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
  tagList: {
    gap: 10,
  },
  tag: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailLine: {
    fontSize: 14,
    lineHeight: 22,
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
});

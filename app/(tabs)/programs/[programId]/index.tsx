import { useIsFocused } from "@react-navigation/native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBackButton } from "@/components/app-back-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { getAuthErrorMessage, requestAuthJson } from "@/lib/auth";
import {
  parseProgramExercisesPayload,
  type ExerciseSummary,
} from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

type ProgramRouteParams = {
  difficultyLabel?: string;
  focusAreaLabel?: string;
  programId: string;
  programTitle?: string;
};

export default function ProgramExercisesScreen() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const router = useRouter();
  const params = useLocalSearchParams<ProgramRouteParams>();
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadExercises = async () => {
      if (typeof params.programId !== "string") {
        setErrorMessage("This program could not be identified.");
        setExercises([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const path = `/api/auth/programs/${params.programId}/exercises/`;
        const payload = await requestAuthJson<unknown>(path, {
          method: "GET",
        });
        const nextExercises = parseProgramExercisesPayload(payload);
        setExercises(nextExercises);
      } catch (error) {
        setExercises([]);
        setErrorMessage(
          getAuthErrorMessage(error, "This program could not be loaded."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadExercises();
  }, [isFocused, params.programId]);

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

  if (errorMessage !== null) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Program unavailable
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {errorMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const programTitle =
    typeof params.programTitle === "string" ? params.programTitle : "Program";
  const programMeta = [
    typeof params.focusAreaLabel === "string" ? params.focusAreaLabel : null,
    typeof params.difficultyLabel === "string" ? params.difficultyLabel : null,
    `${exercises.length} exercises`,
  ]
    .filter((value): value is string => value !== null)
    .join(" • ");

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
          label="Back to programs"
          onPress={() => router.replace("/programs")}
        />

        <ArtworkPanel
          illustration={{
            background: colors.surfaceMuted,
            icon: "library",
            tint: colors.accent,
          }}
          subtitle={programMeta}
          title={programTitle}
        />

        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <Link
              key={exercise.id}
              asChild
              href={{
                pathname: "/programs/[programId]/exercises/[exerciseId]",
                params: {
                  exerciseId: exercise.id,
                  programId: params.programId,
                },
              }}
            >
              <Pressable>
                <AppCard>
                  <View style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={[styles.eyebrow, { color: colors.accent }]}>
                        Exercise {exercise.exerciseOrder ?? index + 1}
                      </Text>
                      {exercise.progress.isFinished && (
                        <View
                          style={[
                            styles.finishedBadge,
                            {
                              backgroundColor: "rgba(47, 197, 141, 0.14)",
                              borderColor: "rgba(47, 197, 141, 0.28)",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.finishedBadgeText,
                              { color: colors.success },
                            ]}
                          >
                            Completed
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.exerciseTitle,
                        {
                          color: exercise.progress.isFinished
                            ? colors.textSecondary
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {exercise.title}
                    </Text>
                    <Text
                      style={[
                        styles.exerciseDescription,
                        {
                          color: exercise.progress.isFinished
                            ? colors.textMuted
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {exercise.description ??
                        "Open this exercise to review instructions and step progress."}
                    </Text>
                    <Text
                      style={[styles.exerciseMeta, { color: colors.textMuted }]}
                    >
                      {formatDuration(exercise.totalDurationSec)} •{" "}
                      {exercise.progress.completedStepsCount}/
                      {exercise.progress.stepsCount} steps complete
                    </Text>
                  </View>
                </AppCard>
              </Pressable>
            </Link>
          ))}
          {exercises.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: colors.textSecondary, marginTop: 8 },
              ]}
            >
              No exercises were returned for this program yet.
            </Text>
          ) : null}
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
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    gap: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  progressBadge: {
    fontSize: 13,
    fontWeight: "700",
  },
  finishedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  finishedBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  finishedBanner: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  finishedBannerText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  exerciseMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});

import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

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

  const handleToggleFavorite = async () => {
    if (!exercise) return;

    if (exercise.isFavorite) {
      Alert.alert(
        "Remove from favorites",
        "Are you sure you want to remove this exercise from your favorites?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => performToggle(),
          },
        ],
      );
    } else {
      await performToggle();
    }
  };

  const performToggle = async () => {
    if (!exercise) return;

    try {
      const path = `/api/auth/programs/${params.programId}/exercises/${exercise.id}/favorite`;
      await requestAuthJson(path, {
        method: "POST",
        body: JSON.stringify({ is_favorite: !exercise.isFavorite }),
      });

      setExercise((current) =>
        current ? { ...current, isFavorite: !current.isFavorite } : null,
      );
    } catch (error) {
      Alert.alert("Error", "Could not update favorite status.");
    }
  };

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
  const currentImageSource = currentStep.image.url;

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={["#E8F5E9", "#F1F8E9", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.dribbbleHeader}>
            <Pressable 
              style={styles.dribbbleHeaderButton}
              onPress={() => router.replace(`/programs/${params.programId}`)}
            >
              <Feather name="chevron-left" size={24} color="#333" />
            </Pressable>
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={styles.dribbbleHeaderSubtitle}>Exercise</Text>
              <Text style={styles.dribbbleHeaderTitle} numberOfLines={1}>{exercise.title}</Text>
            </View>
            <Pressable 
              style={styles.dribbbleHeaderButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                color={exercise.isFavorite ? "#FF5E5E" : "#333"}
                name={exercise.isFavorite ? "heart" : "heart-outline"}
                size={22}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dribbbleCard}>
            <View style={styles.summary}>
              <Text style={styles.dribbbleSectionTitle}>Exercise overview</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {exercise.description ??
                  "Move through the steps in order and review each movement before starting the guided timer."}
              </Text>
              <View style={styles.dribbbleMetaRow}>
                <View style={styles.dribbbleMetaItem}>
                  <Ionicons name="body-outline" size={14} color="#A0A0A0" />
                  <Text style={styles.dribbbleMetaText}>
                    {exercise.bodyArea ?? "general"}
                  </Text>
                </View>
                <View style={styles.dribbbleMetaItem}>
                  <Ionicons name="list-outline" size={14} color="#A0A0A0" />
                  <Text style={styles.dribbbleMetaText}>
                    {exercise.progress.stepsCount} steps
                  </Text>
                </View>
                {prescription.length > 0 ? (
                  <View style={styles.dribbbleMetaItem}>
                    <Ionicons name="repeat-outline" size={14} color="#A0A0A0" />
                    <Text style={styles.dribbbleMetaText}>{prescription}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.dribbbleCard}>
            <View style={styles.summary}>
              <View style={styles.stepPreviewHeader}>
                <View>
                  <Text style={styles.dribbbleSectionTitle}>Movement step</Text>
                  <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                    Step {previewStepIndex + 1} of {exercise.steps.length}
                  </Text>
                </View>
                <View style={[styles.dribbbleStatusBadge, isCompleted && styles.dribbbleStatusBadgeSuccess]}>
                   <Text style={[styles.dribbbleStatusText, isCompleted && styles.dribbbleStatusTextSuccess]}>
                     {isCompleted ? "Completed" : isNextRequiredStep ? "Next" : "Preview"}
                   </Text>
                </View>
              </View>

              <View style={styles.dribbbleImageFrame}>
                {currentImageSource !== null ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: currentImageSource }}
                    style={styles.stepImage}
                  />
                ) : (
                  <View style={styles.stepImagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#A0A0A0" />
                    <Text style={[styles.placeholderText, { marginTop: 12, color: colors.textSecondary }]}>
                      Visual coming soon
                    </Text>
                  </View>
                )}
                <LinearGradient
                   colors={["transparent", "rgba(0,0,0,0.4)"]}
                   style={styles.dribbbleImageOverlay}
                />
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.dribbbleStepTitle}>{currentStep.title}</Text>
                <Text style={[styles.stepInstruction, { color: colors.textSecondary }]}>
                  {currentStep.instruction}
                </Text>
              </View>

              <View style={styles.dribbbleStepNavigation}>
                <Pressable
                  disabled={previewStepIndex === 0}
                  onPress={() => setPreviewStepIndex(v => Math.max(v - 1, 0))}
                  style={[styles.dribbbleNavBtn, previewStepIndex === 0 && { opacity: 0.5 }]}
                >
                  <Feather name="chevron-left" size={24} color="#333" />
                </Pressable>
                
                <View style={styles.dribbbleNavCenter}>
                   {exercise.steps.map((_, idx) => (
                     <View 
                       key={idx} 
                       style={[
                         styles.dribbbleNavDot, 
                         idx === previewStepIndex && styles.dribbbleNavDotActive
                       ]} 
                     />
                   ))}
                </View>

                <Pressable
                  disabled={previewStepIndex >= exercise.steps.length - 1}
                  onPress={() => setPreviewStepIndex(v => Math.min(v + 1, exercise.steps.length - 1))}
                  style={[styles.dribbbleNavBtn, previewStepIndex >= exercise.steps.length - 1 && { opacity: 0.5 }]}
                >
                  <Feather name="chevron-right" size={24} color="#333" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.dribbbleActionCard}>
             <View>
                <Text style={styles.dribbbleActionTitle}>Ready to start?</Text>
                <Text style={styles.dribbbleActionSubtitle}>Follow the guided timer</Text>
             </View>
             <Pressable 
               style={styles.dribbbleStartBtn}
               onPress={() => router.push(`/programs/${exercise.programId}/exercises/${exercise.id}/session`)}
             >
                <Feather name="play" size={24} color="#FFF" />
             </Pressable>
          </View>

      </ScrollView>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    gap: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  dribbbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 10,
  },
  dribbbleHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF80",
    alignItems: "center",
    justifyContent: "center",
  },
  dribbbleHeaderCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  dribbbleHeaderSubtitle: {
    fontSize: 12,
    color: "#66BB6A",
    fontWeight: "600",
  },
  dribbbleHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  dribbbleCard: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dribbbleSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },
  dribbbleMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  dribbbleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dribbbleMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  stepPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  dribbbleStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFF8E1",
  },
  dribbbleStatusBadgeSuccess: {
    backgroundColor: "#E8F5E9",
  },
  dribbbleStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FBC02D",
  },
  dribbbleStatusTextSuccess: {
    color: "#4CAF50",
  },
  dribbbleImageFrame: {
    borderRadius: 30,
    height: 240,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "relative",
  },
  stepImage: {
    width: "100%",
    height: "100%",
  },
  dribbbleImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  stepImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dribbbleStepTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  stepInstruction: {
    fontSize: 15,
    lineHeight: 24,
    color: "#666",
  },
  dribbbleStepNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  dribbbleNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  dribbbleNavCenter: {
    flexDirection: "row",
    gap: 8,
  },
  dribbbleNavDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
  },
  dribbbleNavDotActive: {
    width: 20,
    backgroundColor: "#4EAF63",
  },
  dribbbleActionCard: {
    backgroundColor: "#1C1E21",
    borderRadius: 30,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dribbbleActionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  dribbbleActionSubtitle: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 2,
  },
  dribbbleStartBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4EAF63",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#4EAF63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summary: {
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  detailLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  stepContent: {
    width: "100%",
  },
});

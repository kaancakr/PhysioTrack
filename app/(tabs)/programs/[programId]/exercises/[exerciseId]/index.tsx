import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
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

import { getAuthErrorMessage, requestAuthJson } from "@/lib/auth";
import {
  parseExerciseDetailPayload,
  type ExerciseDetail,
} from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";

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
  const { colors, isDark } = useAppTheme();
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

  // State for schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

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
      // Open modal to select days before favoriting
      setSelectedDays([]);
      setShowScheduleModal(true);
    }
  };

  // Extra closing brace removed

  const performToggle = async (overrideDays?: string[]) => {
    if (!exercise) return;

    const willBeFavorite = !exercise.isFavorite;
    // Determine which days to send: explicit override, selectedDays (modal), or default monday
    const daysToSend = overrideDays ?? (willBeFavorite && selectedDays.length > 0 ? selectedDays : (willBeFavorite ? ["monday"] : null));

    try {
      const path = `/api/auth/programs/${params.programId}/exercises/${exercise.id}/favorite`;
      await requestAuthJson(path, {
        method: "POST",
        body: JSON.stringify({
          is_favorite: willBeFavorite,
          days_of_week: willBeFavorite && daysToSend && daysToSend.length > 0 ? daysToSend : null,
        }),
      });

      setExercise((current) =>
        current ? { ...current, isFavorite: willBeFavorite, daysOfWeek: willBeFavorite ? daysToSend : null } : null,
      );
    } catch {
      Alert.alert("Error", "Could not update favorite status.");
    }
  };
  // Duplicate blocks removed
  // Toggle day selection inside the modal
  const toggleSelectedDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  };

  // Toggle day for already favorited exercise (optimistic update)
  const toggleFavoriteDay = (day: string) => {
    if (!exercise) return;
    const currentDays = exercise.daysOfWeek || [];
    const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
    // optimistic UI update
    setExercise((cur) => cur ? { ...cur, daysOfWeek: newDays } : null);
    // sync with backend
    requestAuthJson(`/api/auth/programs/${params.programId}/exercises/${exercise.id}/favorite`, {
      method: "POST",
      body: JSON.stringify({ is_favorite: true, days_of_week: newDays }),
    }).catch(() => {
      // revert on error
      setExercise((cur) => cur ? { ...cur, daysOfWeek: currentDays } : null);
    });
  };
  // Duplicate toggle block removed

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
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDark
            ? [colors.background, colors.card, colors.surfaceMuted]
            : [colors.accent + "14", colors.accentSoft + "18", colors.background]
        }
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.dribbbleHeader}>
            <Pressable 
              style={[
                styles.dribbbleHeaderButton,
                { backgroundColor: colors.card + "CC", borderColor: colors.border },
              ]}
              onPress={() => router.replace(`/programs/${params.programId}`)}
            >
              <Feather name="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={[styles.dribbbleHeaderSubtitle, { color: colors.accent }]}>Exercise</Text>
              <Text
                style={[styles.dribbbleHeaderTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {exercise.title}
              </Text>
            </View>
            <Pressable 
              style={[
                styles.dribbbleHeaderButton,
                { backgroundColor: colors.card + "CC", borderColor: colors.border },
              ]}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                color={exercise.isFavorite ? colors.danger : colors.textPrimary}
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
          {exercise.isFavorite && (
            <View
              style={[
                styles.dribbbleCard,
                { backgroundColor: colors.card + "D9", borderColor: colors.border },
              ]}
            >
              <View style={styles.summary}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.dribbbleSectionTitle, { color: colors.textPrimary }]}>Schedule Exercise</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.description, { color: colors.textSecondary, marginBottom: 8 }]}>Which days would you like to practice this exercise?</Text>
                <View style={styles.daysRow}>
                  {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(day => {
                    const isSelected = (exercise.daysOfWeek || []).includes(day);
                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceMuted,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => toggleFavoriteDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isSelected ? colors.accentContrast : colors.textSecondary },
                          ]}
                        >
                          {day.charAt(0).toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
          {/* Modal for selecting days when adding to favorites */}
          <Modal visible={showScheduleModal} transparent animationType="fade" onRequestClose={() => setShowScheduleModal(false)}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Schedule Exercise</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>Select the days you want to practice this exercise.</Text>
                <View style={styles.daysRow}>
                  {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(day => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceMuted,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => toggleSelectedDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isSelected ? colors.accentContrast : colors.textSecondary },
                          ]}
                        >
                          {day.charAt(0).toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                  onPress={() => { setShowScheduleModal(false); performToggle(); }}
                >
                  <Text style={[styles.modalConfirmText, { color: colors.accentContrast }]}>Confirm</Text>
                </Pressable>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowScheduleModal(false)}>
                  <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <View
            style={[
              styles.dribbbleCard,
              { backgroundColor: colors.card + "D9", borderColor: colors.border },
            ]}
          >
            <View style={styles.summary}>
              <Text style={[styles.dribbbleSectionTitle, { color: colors.textPrimary }]}>Exercise overview</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {exercise.description ??
                  "Move through the steps in order and review each movement before starting the guided timer."}
              </Text>
              <View style={styles.dribbbleMetaRow}>
                <View style={[styles.dribbbleMetaItem, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="body-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.dribbbleMetaText, { color: colors.textSecondary }]}>
                    {exercise.bodyArea ?? "general"}
                  </Text>
                </View>
                <View style={[styles.dribbbleMetaItem, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="list-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.dribbbleMetaText, { color: colors.textSecondary }]}>
                    {exercise.progress.stepsCount} steps
                  </Text>
                </View>
                {prescription.length > 0 ? (
                  <View style={[styles.dribbbleMetaItem, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name="repeat-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.dribbbleMetaText, { color: colors.textSecondary }]}>{prescription}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.dribbbleCard,
              { backgroundColor: colors.card + "D9", borderColor: colors.border },
            ]}
          >
            <View style={styles.summary}>
              <View style={styles.stepPreviewHeader}>
                <View>
                  <Text style={[styles.dribbbleSectionTitle, { color: colors.textPrimary }]}>Movement step</Text>
                  <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                    Step {previewStepIndex + 1} of {exercise.steps.length}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dribbbleStatusBadge,
                    {
                      backgroundColor: isCompleted
                        ? colors.success + "18"
                        : colors.accent + "14",
                    },
                  ]}
                >
                   <Text
                     style={[
                       styles.dribbbleStatusText,
                       { color: isCompleted ? colors.success : colors.accent },
                     ]}
                   >
                     {isCompleted ? "Completed" : isNextRequiredStep ? "Next" : "Preview"}
                   </Text>
                </View>
              </View>

              <View
                style={[
                  styles.dribbbleImageFrame,
                  { backgroundColor: colors.surfaceMuted },
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
                    <Ionicons name="image-outline" size={48} color={colors.textMuted} />
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
                <Text style={[styles.dribbbleStepTitle, { color: colors.textPrimary }]}>{currentStep.title}</Text>
                <Text style={[styles.stepInstruction, { color: colors.textSecondary }]}>
                  {currentStep.instruction}
                </Text>
              </View>

              <View
                style={[
                  styles.dribbbleStepNavigation,
                  { borderTopColor: colors.border },
                ]}
              >
                <Pressable
                  disabled={previewStepIndex === 0}
                  onPress={() => setPreviewStepIndex(v => Math.max(v - 1, 0))}
                  style={[
                    styles.dribbbleNavBtn,
                    { backgroundColor: colors.surfaceMuted },
                    previewStepIndex === 0 && { opacity: 0.5 },
                  ]}
                >
                  <Feather name="chevron-left" size={24} color={colors.textPrimary} />
                </Pressable>
                
                <View style={styles.dribbbleNavCenter}>
                   {exercise.steps.map((_, idx) => (
                     <View 
                       key={idx} 
                       style={[
                         styles.dribbbleNavDot, 
                         {
                           backgroundColor:
                             idx === previewStepIndex ? colors.accent : colors.border,
                           width: idx === previewStepIndex ? 20 : 6,
                         },
                       ]} 
                     />
                   ))}
                </View>

                <Pressable
                  disabled={previewStepIndex >= exercise.steps.length - 1}
                  onPress={() => setPreviewStepIndex(v => Math.min(v + 1, exercise.steps.length - 1))}
                  style={[
                    styles.dribbbleNavBtn,
                    { backgroundColor: colors.surfaceMuted },
                    previewStepIndex >= exercise.steps.length - 1 && { opacity: 0.5 },
                  ]}
                >
                  <Feather name="chevron-right" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.dribbbleActionCard,
              { backgroundColor: isDark ? colors.card : colors.textPrimary },
            ]}
          >
             <View>
                <Text
                  style={[
                    styles.dribbbleActionTitle,
                    { color: isDark ? colors.textPrimary : colors.accentContrast },
                  ]}
                >
                  Ready to start?
                </Text>
                <Text
                  style={[
                    styles.dribbbleActionSubtitle,
                    { color: isDark ? colors.textSecondary : colors.textMuted },
                  ]}
                >
                  Follow the guided timer
                </Text>
             </View>
             <Pressable 
               style={[styles.dribbbleStartBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
               onPress={() => router.push(`/programs/${exercise.programId}/exercises/${exercise.id}/session`)}
             >
                <Feather name="play" size={24} color={colors.accentContrast} />
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
    borderWidth: 1,
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
    fontWeight: "600",
  },
  dribbbleHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  dribbbleCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dribbbleSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dribbbleMetaText: {
    fontSize: 12,
    fontWeight: "700",
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
  },
  dribbbleStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  dribbbleImageFrame: {
    borderRadius: 30,
    height: 240,
    width: "100%",
    overflow: "hidden",
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
    marginTop: 20,
    marginBottom: 8,
  },
  stepInstruction: {
    fontSize: 15,
    lineHeight: 24,
  },
  dribbbleStepNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  dribbbleNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  dribbbleActionCard: {
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
  },
  dribbbleActionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  dribbbleStartBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
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
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  modalConfirmBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  modalConfirmText: {
    fontWeight: "600",
  },
  modalCancelBtn: {
    marginTop: 12,
  },
  modalCancelText: {},
  // Duplicate styles removed
});

import { Feather, Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [activeExercise, setActiveExercise] = useState<ExerciseSummary | null>(null);

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

  const handleToggleFavorite = async (exercise: ExerciseSummary) => {
    if (exercise.isFavorite) {
      Alert.alert(
        "Remove from favorites",
        "Are you sure you want to remove this exercise from your favorites?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => performToggle(exercise, null),
          },
        ],
      );
    } else {
      setActiveExercise(exercise);
      setSelectedDays([]);
      setShowScheduleModal(true);
    }
  };

  const performToggle = async (exercise: ExerciseSummary, daysToSend: string[] | null) => {
    const willBeFavorite = !exercise.isFavorite;
    const finalDays = daysToSend ?? (willBeFavorite ? ["monday"] : null);

    try {
      const path = `/api/auth/programs/${params.programId}/exercises/${exercise.id}/favorite`;
      await requestAuthJson(path, {
        method: "POST",
        body: JSON.stringify({
          is_favorite: willBeFavorite,
          days_of_week: finalDays
        }),
      });

      setExercises((current) =>
        current.map((item) =>
          item.id === exercise.id
            ? { ...item, isFavorite: willBeFavorite }
            : item,
        ),
      );
    } catch (error) {
      Alert.alert("Error", "Could not update favorite status.");
    }
  };

  const toggleSelectedDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
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
              onPress={() => router.replace("/programs")}
            >
              <Feather name="chevron-left" size={24} color="#333" />
            </Pressable>
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={styles.dribbbleHeaderSubtitle}>Health Plan</Text>
              <Text style={styles.dribbbleHeaderTitle} numberOfLines={1}>{programTitle}</Text>
            </View>
            <Pressable style={styles.dribbbleHeaderButton}>
              <Feather name="share-2" size={20} color="#333" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Modal
            visible={showScheduleModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowScheduleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Schedule Exercise</Text>
                <Text style={styles.modalDescription}>
                  Select the days you want to practice &quot;{activeExercise?.title}&quot;.
                </Text>
                <View style={styles.daysRow}>
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                        onPress={() => toggleSelectedDay(day)}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                          {day.charAt(0).toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={styles.modalConfirmBtn}
                  onPress={() => {
                    if (activeExercise) {
                      setShowScheduleModal(false);
                      performToggle(activeExercise, selectedDays.length > 0 ? selectedDays : ["monday"]);
                    }
                  }}
                >
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </Pressable>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowScheduleModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <View style={styles.dribbbleHeroCard}>
            <View style={styles.dribbbleHeroIllustration}>
              <Ionicons name="medical" size={48} color="#4EAF63" />
            </View>
            <View style={styles.dribbbleHeroContent}>
              <Text style={styles.dribbbleHeroEyebrow}>DAILY SPOTLIGHT</Text>
              <Text style={styles.dribbbleHeroTitle}>{programTitle}</Text>
              <Text style={styles.dribbbleHeroMeta}>{programMeta}</Text>
            </View>
          </View>

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
                  <View style={styles.dribbbleExerciseCard}>
                    <View style={styles.headerTitleRow}>
                      <Text style={styles.dribbbleExerciseEyebrow}>
                        EXERCISE {exercise.exerciseOrder ?? index + 1}
                      </Text>
                      <Pressable
                        hitSlop={12}
                        onPress={() => handleToggleFavorite(exercise)}
                        style={styles.favoriteButton}
                      >
                        <Ionicons
                          color={exercise.isFavorite ? "#FF5E5E" : "#A0A0A0"}
                          name={exercise.isFavorite ? "heart" : "heart-outline"}
                          size={20}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.dribbbleExerciseTitle}>
                      {exercise.title}
                    </Text>
                    <Text style={styles.dribbbleExerciseDesc} numberOfLines={2}>
                      {exercise.description ??
                        "Open this exercise to review instructions and step progress."}
                    </Text>

                    <View style={styles.dribbbleExerciseFooter}>
                      <View style={styles.dribbbleMetaItem}>
                        <Ionicons name="time-outline" size={14} color="#A0A0A0" />
                        <Text style={styles.dribbbleMetaText}>
                          {formatDuration(exercise.totalDurationSec)}
                        </Text>
                      </View>
                      <View style={styles.dribbbleMetaItem}>
                        <Ionicons name="flash-outline" size={14} color="#A0A0A0" />
                        <Text style={styles.dribbbleMetaText}>
                          {exercise.progress.completedStepsCount}/{exercise.progress.stepsCount} steps
                        </Text>
                      </View>
                      {exercise.progress.isFinished && (
                        <View style={styles.dribbbleFinishedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                          <Text style={styles.dribbbleFinishedText}>Done</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
            {exercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No exercises found.</Text>
              </View>
            ) : null}
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
  dribbbleHeroCard: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    alignItems: "center",
  },
  dribbbleHeroIllustration: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#E2EBD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dribbbleHeroContent: {
    alignItems: "center",
  },
  dribbbleHeroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#66BB6A",
    letterSpacing: 1,
    marginBottom: 8,
  },
  dribbbleHeroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  dribbbleHeroMeta: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  exerciseList: {
    gap: 16,
  },
  dribbbleExerciseCard: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dribbbleExerciseEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#66BB6A",
  },
  favoriteButton: {
    padding: 4,
  },
  dribbbleExerciseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },
  dribbbleExerciseDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  dribbbleExerciseFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  dribbbleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dribbbleMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A0A0A0",
  },
  dribbbleFinishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: "auto",
  },
  dribbbleFinishedText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4CAF50",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: {
    backgroundColor: "#4EAF63",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  dayTextSelected: {
    color: "#FFF",
  },
  modalConfirmBtn: {
    backgroundColor: "#4EAF63",
    paddingVertical: 14,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  modalConfirmText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#999",
    fontWeight: "700",
    fontSize: 14,
  },
});
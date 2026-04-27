import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { EXERCISE_PROGRAMS } from "@/data/exercise-programs";
import { useProgress } from "@/providers/progress-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";

function clampProgress(value: number) {
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

function getCompletedDurationSec(
  stepDurationsSec: number[],
  currentStepIndex: number,
  elapsedStepSec: number,
) {
  const completedStepsDurationSec = stepDurationsSec
    .slice(0, currentStepIndex)
    .reduce((totalDurationSec, stepDurationSec) => {
      return totalDurationSec + stepDurationSec;
    }, 0);

  const currentStepDurationSec = stepDurationsSec[currentStepIndex] ?? 0;
  const currentStepContributionSec = Math.min(
    elapsedStepSec,
    currentStepDurationSec,
  );

  return completedStepsDurationSec + currentStepContributionSec;
}

export default function SessionScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ programId: string }>();
  const {
    activeSession,
    finishSession,
    pauseSession,
    resumeSession,
    setCurrentStep,
    startSession,
    syncElapsed,
  } = useProgress();
  const program = EXERCISE_PROGRAMS.find((item) => item.id === params.programId) ?? null;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedStepSec, setElapsedStepSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const activeSessionRef = useRef(activeSession);
  const currentStepIndexRef = useRef(currentStepIndex);
  const elapsedStepSecRef = useRef(elapsedStepSec);
  const isReadyRef = useRef(isReady);
  const isPausedRef = useRef(isPaused);

  const persistProgress = useCallback(
    async (nextStepIndex: number, nextElapsedStepSec: number) => {
      if (program === null) {
        return;
      }

      const latestSession = activeSessionRef.current;

      if (
        latestSession === null ||
        latestSession.programId !== program.id ||
        latestSession.completedAt !== null
      ) {
        return;
      }

      await syncElapsed(program.id, nextStepIndex, nextElapsedStepSec);
    },
    [program, syncElapsed],
  );

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    elapsedStepSecRef.current = elapsedStepSec;
  }, [elapsedStepSec]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const initializeSession = async () => {
      if (program === null) {
        setIsReady(true);
        return;
      }

      if (isReadyRef.current) {
        return;
      }

      if (activeSession !== null && activeSession.programId === program.id) {
        const recoveredElapsed = activeSession.isPaused
          ? activeSession.elapsedStepSec
          : activeSession.elapsedStepSec +
            Math.max(0, Math.floor((Date.now() - new Date(activeSession.updatedAt).getTime()) / 1000));

        setCurrentStepIndex(activeSession.currentStepIndex);
        setElapsedStepSec(recoveredElapsed);
        setIsPaused(activeSession.isPaused);
        setIsReady(true);
        return;
      }

      const session = await startSession(program.id);
      setCurrentStepIndex(session.currentStepIndex);
      setElapsedStepSec(session.elapsedStepSec);
      setIsPaused(session.isPaused);
      setIsReady(true);
    };

    void initializeSession();
  }, [activeSession, program, startSession]);

  useEffect(() => {
    if (!isReady || program === null || activeSession === null) {
      return;
    }

    if (activeSession.programId !== program.id) {
      return;
    }

    if (activeSession.currentStepIndex !== currentStepIndexRef.current) {
      setCurrentStepIndex(activeSession.currentStepIndex);
      setElapsedStepSec(activeSession.elapsedStepSec);
    }

    if (activeSession.isPaused !== isPausedRef.current) {
      setIsPaused(activeSession.isPaused);
    }
  }, [activeSession, isReady, program]);

  useEffect(() => {
    if (!isReady || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedStepSec((currentValue) => currentValue + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPaused, isReady]);

  useEffect(() => {
    if (!isReady || program === null) {
      return;
    }

    if (elapsedStepSec === 0 || elapsedStepSec % 5 !== 0) {
      return;
    }

    void persistProgress(currentStepIndex, elapsedStepSec);
  }, [currentStepIndex, elapsedStepSec, isReady, persistProgress, program]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const latestProgram = program;

      if (latestProgram === null || !isReadyRef.current) {
        return;
      }

      if (nextState !== "active") {
        void persistProgress(currentStepIndexRef.current, elapsedStepSecRef.current);
        return;
      }

      const latestSession = activeSessionRef.current;

      if (
        latestSession !== null &&
        latestSession.programId === latestProgram.id &&
        !latestSession.isPaused
      ) {
        const updatedElapsed =
          latestSession.elapsedStepSec +
          Math.max(
            0,
            Math.floor((Date.now() - new Date(latestSession.updatedAt).getTime()) / 1000),
          );

        setCurrentStepIndex(latestSession.currentStepIndex);
        setElapsedStepSec(updatedElapsed);
        setIsPaused(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [persistProgress, program]);

  useEffect(() => {
    return () => {
      if (!isReadyRef.current || program === null) {
        return;
      }

      void persistProgress(currentStepIndexRef.current, elapsedStepSecRef.current);
    };
  }, [persistProgress, program]);

  if (program === null) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Session not found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            This exercise session could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = program.steps[currentStepIndex];
  const stepDurationsSec = program.steps.map((step) => step.durationSec);
  const completedRatio = clampProgress(elapsedStepSec / currentStep.durationSec);
  const isCurrentStepComplete = elapsedStepSec >= currentStep.durationSec;
  const remainingSteps = program.steps.length - currentStepIndex - 1;
  const currentStatusLabel = isCurrentStepComplete
    ? "Completed"
    : isPaused
      ? "Paused"
      : "In progress";
  const currentStatusIconName = isCurrentStepComplete
    ? "checkmark-circle"
    : isPaused
      ? "pause-circle"
      : "play-circle";
  const primaryActionLabel = isCurrentStepComplete
    ? currentStepIndex >= program.steps.length - 1
      ? "Finish session"
      : "Next step"
    : "Mark step done";

  const goToPreviousStep = async () => {
    if (currentStepIndex === 0) {
      return;
    }

    const nextStepIndex = currentStepIndex - 1;
    setCurrentStepIndex(nextStepIndex);
    setElapsedStepSec(0);
    setIsPaused(false);
    await setCurrentStep(program.id, nextStepIndex, 0);
  };

  const completeCurrentStep = async () => {
    const completedElapsed = currentStep.durationSec;

    setElapsedStepSec(completedElapsed);
    await persistProgress(currentStepIndex, completedElapsed);
  };

  const goToNextStep = async () => {
    const completedDurationSec = getCompletedDurationSec(
      stepDurationsSec,
      currentStepIndex,
      currentStep.durationSec,
    );

    if (currentStepIndex >= program.steps.length - 1) {
      await finishSession(program.id, completedDurationSec);
      router.replace(
        `/session/complete/${program.id}?durationSec=${completedDurationSec}&stepCount=${program.steps.length}`,
      );
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextStepIndex);
    setElapsedStepSec(0);
    setIsPaused(false);
    await setCurrentStep(program.id, nextStepIndex, 0);
  };

  const togglePause = async () => {
    if (isPaused) {
      setIsPaused(false);
      await resumeSession(program.id);
      return;
    }

    setIsPaused(true);
    await pauseSession(program.id, currentStepIndex, elapsedStepSec);
  };

  const finishCurrentSession = async () => {
    const completedDurationSec = getCompletedDurationSec(
      stepDurationsSec,
      currentStepIndex,
      elapsedStepSec,
    );

    await finishSession(program.id, completedDurationSec);
    router.replace(
      `/session/complete/${program.id}?durationSec=${completedDurationSec}&stepCount=${currentStepIndex + 1}`,
    );
  };

  const handlePrimaryAction = async () => {
    if (!isCurrentStepComplete) {
      await completeCurrentStep();
      return;
    }

    await goToNextStep();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionLabel, { color: colors.accent }]}>Guided session</Text>
          <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>{program.title}</Text>
          <Text style={[styles.sessionCopy, { color: colors.textSecondary }]}>
            Follow each movement step at your own pace and keep the routine comfortable.
          </Text>
        </View>

        <ArtworkPanel
          illustration={currentStep.image}
          subtitle={`Step ${currentStepIndex + 1} of ${program.steps.length} • ${remainingSteps} remaining`}
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
                    backgroundColor: isCurrentStepComplete
                      ? colors.success
                      : colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  color={
                    isCurrentStepComplete
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
                      color: isCurrentStepComplete
                        ? colors.accentContrast
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {currentStatusLabel}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
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
              Suggested step length: {formatDuration(currentStep.durationSec)}
            </Text>
            <Text
              style={[
                styles.stepSupportText,
                {
                  color: isCurrentStepComplete ? colors.success : colors.textSecondary,
                },
              ]}
            >
              {isCurrentStepComplete
                ? "This step is marked complete. Continue when you feel ready."
                : "Let the timer run or mark the step done when the movement feels complete."}
            </Text>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.stepTrackerSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Session steps</Text>
            <View style={styles.stepTrackerList}>
              {program.steps.map((step, stepIndex) => {
                const isStepActive = stepIndex === currentStepIndex;
                const isStepDone =
                  stepIndex < currentStepIndex ||
                  (stepIndex === currentStepIndex && isCurrentStepComplete);
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
                          {stepIndex < currentStepIndex
                            ? "Completed"
                            : stepIndex === currentStepIndex
                              ? currentStatusLabel
                              : "Up next"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.stepTrackerDuration, { color: colors.textMuted }]}>
                      {formatDuration(step.durationSec)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.instructionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How to do this step</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              {currentStep.instruction}
            </Text>
            <Text style={[styles.cautionText, { color: colors.textMuted }]}>
              Caution: {currentStep.cautionNote}
            </Text>
          </View>
        </AppCard>

        <View style={styles.controls}>
          <AppButton
            disabled={currentStepIndex === 0}
            label="Back"
            onPress={() => {
              void goToPreviousStep();
            }}
            variant="secondary"
          />
          <AppButton
            label={isPaused ? "Resume" : "Pause"}
            onPress={() => {
              void togglePause();
            }}
            variant="secondary"
          />
        </View>

        <View style={styles.controls}>
          <AppButton
            label={primaryActionLabel}
            onPress={() => {
              void handlePrimaryAction();
            }}
          />
          <AppButton
            label="Finish now"
            onPress={() => {
              void finishCurrentSession();
            }}
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
  content: {
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sessionHeader: {
    gap: 6,
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sessionTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  sessionCopy: {
    fontSize: 15,
    lineHeight: 22,
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
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  timerValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  progressTrack: {
    borderRadius: 999,
    height: 12,
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
    fontWeight: "600",
    lineHeight: 20,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepTrackerSection: {
    gap: 14,
  },
  stepTrackerList: {
    gap: 10,
  },
  stepTrackerItem: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  stepTrackerMeta: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  stepTrackerTextGroup: {
    flex: 1,
    gap: 3,
  },
  stepTrackerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  stepTrackerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  stepTrackerDuration: {
    fontSize: 12,
    fontWeight: "700",
  },
  instructionsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  cautionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
  },
});

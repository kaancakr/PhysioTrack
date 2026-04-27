import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { useSession } from "@/providers/session-provider";
import { getScreenMetrics } from "@/theme/layout";
import { wp } from "@/theme/responsive";
import { type FocusArea, type UserIntakeProfile, type WeeklyGoal } from "@/types/domain";
import { useAppTheme } from "@/providers/theme-provider";

type AgeRange = UserIntakeProfile["ageRange"];

const FOCUS_OPTIONS: { description: string; label: string; value: FocusArea }[] = [
  { description: "Desk strain and stiffness", label: "Neck", value: "neck" },
  { description: "Mobility and control", label: "Shoulder", value: "shoulder" },
  { description: "Support and movement comfort", label: "Back", value: "back" },
  { description: "Strength and confidence", label: "Knee", value: "knee" },
];

const AGE_OPTIONS: { label: string; value: AgeRange }[] = [
  { label: "18-29", value: "18-29" },
  { label: "30-44", value: "30-44" },
  { label: "45-59", value: "45-59" },
  { label: "60+", value: "60+" },
];

const WEEKLY_GOALS: { label: string; value: WeeklyGoal }[] = [
  { label: "2 sessions", value: 2 },
  { label: "3 sessions", value: 3 },
  { label: "4 sessions", value: 4 },
  { label: "5 sessions", value: 5 },
];

const STEP_GOALS: { label: string; value: UserIntakeProfile["dailyStepGoal"] }[] = [
  { label: "3,000", value: 3000 },
  { label: "5,000", value: 5000 },
  { label: "7,000", value: 7000 },
  { label: "9,000", value: 9000 },
];

function StepBadge(props: { index: number; isActive: boolean; isComplete: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.stepBadge,
        {
          backgroundColor: props.isActive || props.isComplete ? colors.accent : colors.surfaceMuted,
        },
      ]}
    >
      <Text
        style={[
          styles.stepBadgeText,
          {
            color: props.isActive || props.isComplete ? colors.accentContrast : colors.textMuted,
          },
        ]}
      >
        {props.index}
      </Text>
    </View>
  );
}

function OptionPill(props: {
  description?: string;
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: props.isSelected ? colors.accentSoft : colors.card,
          borderColor: props.isSelected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.optionLabel,
          {
            color: props.isSelected ? colors.accent : colors.textPrimary,
          },
        ]}
      >
        {props.label}
      </Text>
      {props.description !== undefined ? (
        <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
          {props.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { profile, saveIntakeProfile } = useSession();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);

  const [stepIndex, setStepIndex] = useState(0);
  const [fullName, setFullName] = useState(profile?.fullName ?? "Demo Patient");
  const [focusArea, setFocusArea] = useState<FocusArea>("back");
  const [ageRange, setAgeRange] = useState<AgeRange>("30-44");
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(3);
  const [dailyStepGoal, setDailyStepGoal] = useState<UserIntakeProfile["dailyStepGoal"]>(5000);

  const handleContinue = async () => {
    if (stepIndex < 2) {
      setStepIndex(stepIndex + 1);
      return;
    }

    await saveIntakeProfile({
      ageRange,
      dailyStepGoal,
      focusArea,
      fullName: fullName.trim().length > 0 ? fullName.trim() : "Patient",
      weeklyGoal,
    });
    router.replace("/(tabs)/dashboard");
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      return;
    }

    setStepIndex(stepIndex - 1);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { gap: metrics.sectionGap, maxWidth: metrics.contentMaxWidth }]}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>Set up your plan</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Let&apos;s tailor your recovery dashboard.
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We&apos;ll use a few details to shape your goals, focus area, and daily tracking.
            </Text>
          </View>

          <View style={styles.stepRow}>
            {[1, 2, 3].map((item, index) => (
              <StepBadge
                index={item}
                isActive={stepIndex === index}
                isComplete={stepIndex > index}
                key={item}
              />
            ))}
          </View>

          <AppCard>
            <View style={[styles.cardContent, { gap: metrics.panelGap }]}>
              {stepIndex === 0 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>About you</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    Share the basics so your home plan feels personal from the start.
                  </Text>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full name</Text>
                    <TextInput
                      onChangeText={setFullName}
                      placeholder="Jamie Patient"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={fullName}
                    />
                  </View>
                  <View style={styles.optionGrid}>
                    {AGE_OPTIONS.map((option) => (
                      <OptionPill
                        isSelected={ageRange === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => {
                          setAgeRange(option.value);
                        }}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 1 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Choose your focus</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    We&apos;ll bring the most relevant exercise program to the top of your home screen.
                  </Text>
                  <View style={styles.optionList}>
                    {FOCUS_OPTIONS.map((option) => (
                      <OptionPill
                        description={option.description}
                        isSelected={focusArea === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => {
                          setFocusArea(option.value);
                        }}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 2 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Set your weekly rhythm</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    These goals power the bars and circles on your dashboard.
                  </Text>
                  <View style={styles.optionGrid}>
                    {WEEKLY_GOALS.map((option) => (
                      <OptionPill
                        isSelected={weeklyGoal === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => {
                          setWeeklyGoal(option.value);
                        }}
                      />
                    ))}
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Daily step goal</Text>
                  <View style={styles.optionGrid}>
                    {STEP_GOALS.map((option) => (
                      <OptionPill
                        isSelected={dailyStepGoal === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => {
                          setDailyStepGoal(option.value);
                        }}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </AppCard>

          <View style={[styles.actionRow, width < 420 ? styles.actionColumn : null]}>
            <AppButton
              disabled={stepIndex === 0}
              label="Back"
              onPress={handleBack}
              variant="secondary"
            />
            <AppButton
              label={stepIndex === 2 ? "Finish setup" : "Continue"}
              onPress={() => {
                void handleContinue();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 16,
  },
  container: {
    alignSelf: "center",
    width: "100%",
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
  },
  stepBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardContent: {
    width: "100%",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionList: {
    gap: 10,
  },
  optionPill: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: wp(390, 28),
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionColumn: {
    flexDirection: "column",
  },
});

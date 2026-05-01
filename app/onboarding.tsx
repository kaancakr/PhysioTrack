import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, Image } from "react-native";
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
  const { profile, saveIntakeProfile, currentUserId } = useSession();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { t } = useTranslation();

  const [stepIndex, setStepIndex] = useState(-1);
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
    
    if (currentUserId === null) {
      router.replace("/(auth)/welcome");
    } else {
      router.replace("/(tabs)/dashboard");
    }
  };

  const handleBack = () => {
    if (stepIndex <= 0) {
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
          {stepIndex === -1 ? (
            <>
              <View style={styles.introContainer}>
                <Text style={[styles.introTitle, { color: colors.textPrimary }]}>{t("onboarding.introTitle")}</Text>
                <Image
                  source={require("@/assets/images/welcome-illustration.png")}
                  style={styles.introIllustration}
                  resizeMode="cover"
                />
                <View style={styles.introTextContainer}>
                  <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>{t("onboarding.introSubtitle")}</Text>
                </View>
              </View>
            </>
          ) : null}

          {stepIndex >= 0 ? (
            <>
              <View style={styles.header}>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>{t("onboarding.eyebrow")}</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t("onboarding.title")}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t("onboarding.subtitle")}
                </Text>
              </View>

              <AppCard style={styles.card}>
                <View style={[styles.cardContent, { gap: metrics.panelGap }]}>
              {stepIndex === 0 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t("onboarding.step1.title")}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    {t("onboarding.step1.text")}
                  </Text>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t("onboarding.step1.fullNameLabel")}</Text>
                    <TextInput
                      onChangeText={setFullName}
                      placeholder={t("onboarding.step1.fullNamePlaceholder")}
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
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setAgeRange(option.value);
                        }}
                        style={[
                          styles.ageCard,
                          {
                            borderColor: ageRange === option.value ? colors.accent : colors.border,
                            backgroundColor: ageRange === option.value ? colors.accent + "15" : colors.card,
                          },
                        ]}
                      >
                        <Text style={[styles.ageCardLabel, { color: ageRange === option.value ? colors.textPrimary : colors.textSecondary }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 1 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t("onboarding.step2.title")}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    {t("onboarding.step2.text")}
                  </Text>
                  <View style={styles.focusGrid}>
                    {FOCUS_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setFocusArea(option.value);
                        }}
                        style={[
                          styles.focusCard,
                          {
                            borderColor: focusArea === option.value ? colors.accent : colors.border,
                            backgroundColor: focusArea === option.value ? colors.accent + "15" : colors.card,
                          },
                        ]}
                      >
                        <View style={[styles.focusCardIconContainer, { backgroundColor: colors.surfaceMuted }]}>
                          <Feather
                            name={
                              option.value === "neck"
                                ? "user"
                                : option.value === "shoulder"
                                ? "activity"
                                : option.value === "back"
                                ? "align-center"
                                : "disc"
                            }
                            size={32}
                            color={focusArea === option.value ? colors.accent : colors.textMuted}
                          />
                        </View>
                        <Text style={[styles.focusCardLabel, { color: colors.textPrimary }]}>
                          {t(`onboarding.options.focus.${option.value}.label`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 2 ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t("onboarding.step3.title")}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    {t("onboarding.step3.text")}
                  </Text>
                  <View style={styles.optionGrid}>
                    {WEEKLY_GOALS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setWeeklyGoal(option.value);
                        }}
                        style={[
                          styles.goalCard,
                          {
                            borderColor: weeklyGoal === option.value ? colors.accent : colors.border,
                            backgroundColor: weeklyGoal === option.value ? colors.accent + "15" : colors.card,
                          },
                        ]}
                      >
                        <Text style={[styles.goalCardLabel, { color: weeklyGoal === option.value ? colors.textPrimary : colors.textSecondary }]}>
                          {t(`onboarding.options.weekly.${option.value}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                   <Text style={[styles.fieldLabel, styles.centeredLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                    {t("onboarding.step3.dailyStepGoalLabel")}
                  </Text>
                  <View style={[styles.optionGrid, { justifyContent: "center" }]}>
                    {STEP_GOALS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setDailyStepGoal(option.value);
                        }}
                        style={[
                          styles.stepCard,
                          {
                            borderColor: dailyStepGoal === option.value ? colors.accent : colors.border,
                            backgroundColor: dailyStepGoal === option.value ? colors.accent + "15" : colors.card,
                          },
                        ]}
                      >
                        <Text style={[styles.stepCardLabel, { color: dailyStepGoal === option.value ? colors.textPrimary : colors.textSecondary }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
                </View>
              </AppCard>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: metrics.horizontalPadding }]}>
        {stepIndex === -1 ? (
          <View style={styles.introButtonContainer}>
            <Pressable
              onPress={() => {
                setStepIndex(0);
              }}
            >
              <LinearGradient
                colors={[colors.accent, "#52796f"]} // Professional green gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.introCustomButton}
              >
                <Text style={[styles.introCustomButtonText, { color: colors.accentContrast }]}>
                  {t("onboarding.introStart")}
                </Text>
                <View style={[styles.introCustomButtonIcon, { backgroundColor: "#FDE047" }]}>
                  <Feather name="arrow-right" size={20} color="#52796f" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <AppButton
                disabled={stepIndex === 0}
                label={t("onboarding.buttons.back")}
                onPress={handleBack}
                variant="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                label={stepIndex === 2 ? t("onboarding.buttons.finish") : t("onboarding.buttons.continue")}
                onPress={() => {
                  void handleContinue();
                }}
              />
            </View>
          </View>
        )}
      </View>
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
  footer: {
    paddingBottom: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  card: {
    borderRadius: 32,
    padding: 24,
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
  centeredLabel: {
    textAlign: "center",
    width: "100%",
    marginBottom: 8,
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
  introContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 32,
    flex: 1,
    minHeight: 500,
  },
  introTitle: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  introIllustration: {
    width: "100%",
    height: 350,
    borderRadius: 48,
    overflow: "hidden",
  },
  introTextContainer: {
    gap: 12,
    paddingHorizontal: 16,
  },
  introSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  introButtonContainer: {
    marginTop: "auto",
    paddingTop: 20,
  },
  introCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingLeft: 28,
    paddingRight: 8,
    borderRadius: 999,
    minHeight: 64,
  },
  introCustomButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  introCustomButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 20,
  },
  focusCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  focusCardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ageCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ageCardLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  goalCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCardLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  stepCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCardLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  focusCardLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});

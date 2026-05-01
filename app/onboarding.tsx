import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { getScreenMetrics } from "@/theme/layout";
import {
  type FocusArea,
  type UserIntakeProfile,
  type WeeklyGoal,
} from "@/types/domain";

type AgeRange = UserIntakeProfile["ageRange"];
type OnboardingStepIndex = -1 | 0 | 1 | 2;
type FocusOption = {
  description: string;
  icon: keyof typeof Feather.glyphMap;
  value: FocusArea;
};
type AgeOption = {
  label: string;
  value: AgeRange;
};
type GoalOption = {
  label: string;
  value: WeeklyGoal;
};
type DailyStepGoalOption = {
  label: string;
  value: UserIntakeProfile["dailyStepGoal"];
};
type ProgressStep = {
  description: string;
  index: 0 | 1 | 2;
  title: string;
};

const FOCUS_OPTIONS: FocusOption[] = [
  { description: "Desk strain and stiffness", icon: "user", value: "neck" },
  { description: "Mobility and control", icon: "activity", value: "shoulder" },
  {
    description: "Support and movement comfort",
    icon: "align-center",
    value: "back",
  },
  { description: "Strength and confidence", icon: "disc", value: "knee" },
];

const AGE_OPTIONS: AgeOption[] = [
  { label: "18-29", value: "18-29" },
  { label: "30-44", value: "30-44" },
  { label: "45-59", value: "45-59" },
  { label: "60+", value: "60+" },
];

const WEEKLY_GOALS: GoalOption[] = [
  { label: "2 sessions", value: 2 },
  { label: "3 sessions", value: 3 },
  { label: "4 sessions", value: 4 },
  { label: "5 sessions", value: 5 },
];

const STEP_GOALS: DailyStepGoalOption[] = [
  { label: "3,000", value: 3000 },
  { label: "5,000", value: 5000 },
  { label: "7,000", value: 7000 },
  { label: "9,000", value: 9000 },
];

function getProgressSteps(t: (key: string) => string): ProgressStep[] {
  return [
    {
      description: t("onboarding.progress.aboutDesc"),
      index: 0,
      title: t("onboarding.progress.aboutTitle"),
    },
    {
      description: t("onboarding.progress.focusDesc"),
      index: 1,
      title: t("onboarding.progress.focusTitle"),
    },
    {
      description: t("onboarding.progress.goalsDesc"),
      index: 2,
      title: t("onboarding.progress.goalsTitle"),
    },
  ];
}

function getNextStepIndex(stepIndex: OnboardingStepIndex): 0 | 1 | 2 {
  if (stepIndex === -1) {
    return 0;
  }

  if (stepIndex === 0) {
    return 1;
  }

  return 2;
}

function ProgressHeader(props: {
  currentStep: ProgressStep;
  stepIndex: 0 | 1 | 2;
  steps: ProgressStep[];
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressLines}>
        {props.steps.map((step) => {
          const isActive = props.stepIndex === step.index;
          const isComplete = props.stepIndex > step.index;

          return (
            <View
              key={step.index}
              style={[
                styles.progressLine,
                {
                  backgroundColor:
                    isActive || isComplete
                      ? colors.accent
                      : colors.surfaceMuted,
                  opacity: isActive ? 1 : isComplete ? 0.9 : 0.6,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.progressCopy}>
        <Text style={[styles.progressEyebrow, { color: colors.accent }]}>
          {titledStepLabel(props.stepIndex + 1, props.steps.length)}
        </Text>
        <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>
          {props.currentStep.title}
        </Text>
        <Text
          style={[styles.progressDescription, { color: colors.textSecondary }]}
        >
          {props.currentStep.description}
        </Text>
      </View>
    </View>
  );
}

function titledStepLabel(currentStep: number, totalSteps: number): string {
  return `${currentStep}/${totalSteps}`;
}

function SelectableCard(props: {
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  isSelected: boolean;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const isCompact = props.icon === undefined && props.description === undefined;
  const isDetailed =
    props.icon !== undefined && props.description !== undefined;

  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.selectableCard,
        isCompact ? styles.selectableCardCompact : null,
        isDetailed ? styles.selectableCardDetailed : null,
        {
          backgroundColor: props.isSelected
            ? colors.accent + "14"
            : colors.card,
          borderColor: props.isSelected ? colors.accent : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.selectableCardHeader,
          isCompact ? styles.selectableCardHeaderCompact : null,
        ]}
      >
        {props.icon !== undefined ? (
          <View
            style={[
              styles.selectableCardIcon,
              { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <Feather
              color={props.isSelected ? colors.accent : colors.textMuted}
              name={props.icon}
              size={18}
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.selectableCardLabel,
            isCompact ? styles.selectableCardLabelCompact : null,
            props.labelStyle ?? null,
            { color: colors.textPrimary },
          ]}
        >
          {props.label}
        </Text>
        <View
          style={[
            styles.selectionIndicator,
            isCompact ? styles.selectionIndicatorCompact : null,
            {
              backgroundColor: props.isSelected ? colors.accent : "transparent",
              borderColor: props.isSelected ? colors.accent : colors.border,
            },
          ]}
        >
          {props.isSelected ? (
            <Feather color={colors.accentContrast} name="check" size={12} />
          ) : null}
        </View>
      </View>
      {props.description !== undefined ? (
        <Text
          style={[
            styles.selectableCardDescription,
            { color: colors.textSecondary },
          ]}
        >
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
  const { t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const progressSteps = getProgressSteps(t);
  const transitionValue = useRef(new Animated.Value(1)).current;

  const [stepIndex, setStepIndex] = useState<OnboardingStepIndex>(-1);
  const [fullName, setFullName] = useState<string>(
    profile?.fullName ?? "",
  );
  const [focusArea, setFocusArea] = useState<FocusArea>("back");
  const [ageRange, setAgeRange] = useState<AgeRange>("30-44");
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(3);
  const [dailyStepGoal, setDailyStepGoal] =
    useState<UserIntakeProfile["dailyStepGoal"]>(5000);
  const [isIntroTransitionRunning, setIsIntroTransitionRunning] =
    useState<boolean>(false);

  const nextStepIndex = getNextStepIndex(stepIndex);
  const currentStep = progressSteps[nextStepIndex];
  const activeStepIndex = stepIndex === -1 ? 0 : stepIndex;
  const introMinHeight = Math.max(height * 0.84, 620);
  const selectedFocusOption = FOCUS_OPTIONS.find(
    (option) => option.value === focusArea,
  );

  const animateContentIn = () => {
    transitionValue.setValue(0);

    Animated.timing(transitionValue, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      setIsIntroTransitionRunning(false);
    });
  };

  const handleStartOnboarding = () => {
    if (isIntroTransitionRunning) {
      return;
    }

    setIsIntroTransitionRunning(true);

    Animated.timing(transitionValue, {
      duration: 150,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setStepIndex(0);
      animateContentIn();
    });
  };

  const handleContinue = async () => {
    if (stepIndex < 2) {
      setStepIndex((stepIndex + 1) as OnboardingStepIndex);
      return;
    }

    await saveIntakeProfile({
      ageRange,
      dailyStepGoal,
      focusArea,
      fullName:
        fullName.trim().length > 0
          ? fullName.trim()
          : t("onboarding.defaults.fullName"),
      weeklyGoal,
    });

    if (currentUserId === null) {
      router.replace("/(auth)/welcome");
      return;
    }

    router.replace("/(tabs)/dashboard");
  };

  const handleBack = () => {
    if (stepIndex <= 0) {
      return;
    }

    setStepIndex((stepIndex - 1) as OnboardingStepIndex);
  };

  const animatedStageStyle = {
    opacity: transitionValue,
    transform: [
      {
        translateX: transitionValue.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: stepIndex >= 0 ? 152 : 28,
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            animatedStageStyle,
            {
              gap: metrics.sectionGap,
              maxWidth: metrics.contentMaxWidth,
            },
          ]}
        >
          {stepIndex === -1 ? (
            <View
              style={[
                styles.introLayout,
                {
                  marginHorizontal: -metrics.horizontalPadding,
                  minHeight: introMinHeight,
                },
              ]}
            >
              <View style={styles.introHero}>
                <View
                  style={[
                    styles.introGlow,
                    styles.introGlowTop,
                    { backgroundColor: colors.accent + "14" },
                  ]}
                />
                <View
                  style={[
                    styles.introGlow,
                    styles.introGlowBottom,
                    { backgroundColor: colors.accentSoft + "18" },
                  ]}
                />
                <View
                  style={[
                    styles.introContentWrap,
                    { paddingHorizontal: metrics.horizontalPadding },
                  ]}
                >
                  <View
                    style={[
                      styles.introBadge,
                      { backgroundColor: colors.accent + "14" },
                    ]}
                  >
                    <Feather name="heart" size={14} color={colors.accent} />
                    <Text
                      style={[styles.introBadgeText, { color: colors.accent }]}
                    >
                      {t("onboarding.introBadge")}
                    </Text>
                  </View>

                  <Text
                    style={[styles.introTitle, { color: colors.textPrimary }]}
                  >
                    {t("onboarding.introTitle")}
                  </Text>

                  <Text
                    style={[
                      styles.introSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("onboarding.introSubtitle")}
                  </Text>

                  <View style={styles.illustrationWrap}>
                    <View
                      style={[
                        styles.floatingCard,
                        styles.floatingCardLeft,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Feather
                        name="activity"
                        size={16}
                        color={colors.accent}
                      />
                      <Text
                        style={[
                          styles.floatingCardText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {t("onboarding.introFloatingLeft")}
                      </Text>
                    </View>

                    <Image
                      resizeMode="contain"
                      source={require("@/assets/images/welcome-illustration.png")}
                      style={styles.introIllustration}
                    />

                    <View
                      style={[
                        styles.floatingCard,
                        styles.floatingCardRight,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Feather
                        name="check-circle"
                        size={16}
                        color={colors.accent}
                      />
                      <Text
                        style={[
                          styles.floatingCardText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {t("onboarding.introFloatingRight")}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    disabled={isIntroTransitionRunning}
                    onPress={handleStartOnboarding}
                    style={[
                      styles.introButton,
                      {
                        backgroundColor: colors.accent,
                        opacity: isIntroTransitionRunning ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.introButtonText,
                        { color: colors.accentContrast },
                      ]}
                    >
                      {t("onboarding.introStart")}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={18}
                      color={colors.accentContrast}
                    />
                  </Pressable>

                  <View style={styles.introBenefits}>
                    <View style={styles.introBenefitItem}>
                      <Feather
                        name="clock"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.introBenefitText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("onboarding.introBenefitSetup")}
                      </Text>
                    </View>

                    <View style={styles.introBenefitItem}>
                      <Feather
                        name="shield"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.introBenefitText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("onboarding.introBenefitGuided")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              <ProgressHeader
                currentStep={currentStep}
                stepIndex={activeStepIndex}
                steps={progressSteps}
              />

              <AppCard style={styles.card}>
                <View style={[styles.cardContent, { gap: metrics.panelGap }]}>
                  {stepIndex === 0 ? (
                    <>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step1.title")}
                        </Text>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.text")}
                        </Text>
                      </View>

                      <View style={styles.namePanel}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.fullNameLabel")}
                        </Text>
                        <TextInput
                          onChangeText={setFullName}
                          placeholder={t(
                            "onboarding.step1.fullNamePlaceholder",
                          )}
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

                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.optionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step1.ageTitle")}
                        </Text>
                        <Text
                          style={[
                            styles.optionSubheading,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.ageText")}
                        </Text>
                      </View>

                      <View style={styles.grid}>
                        {AGE_OPTIONS.map((option) => (
                          <SelectableCard
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
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step2.title")}
                        </Text>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step2.text")}
                        </Text>
                      </View>

                      {selectedFocusOption !== undefined ? (
                        <View
                          style={[
                            styles.helperBanner,
                            { backgroundColor: colors.accent + "12" },
                          ]}
                        >
                          <View
                            style={[
                              styles.helperBannerIcon,
                              { backgroundColor: colors.card },
                            ]}
                          >
                            <Feather
                              color={colors.accent}
                              name={selectedFocusOption.icon}
                              size={18}
                            />
                          </View>
                          <Text
                            style={[
                              styles.helperBannerText,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {t(`onboarding.options.focus.${focusArea}.desc`)}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.grid}>
                        {FOCUS_OPTIONS.map((option) => (
                          <SelectableCard
                            description={t(
                              `onboarding.options.focus.${option.value}.desc`,
                            )}
                            icon={option.icon}
                            isSelected={focusArea === option.value}
                            key={option.value}
                            label={t(
                              `onboarding.options.focus.${option.value}.label`,
                            )}
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
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.goalCardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step3.title")}
                        </Text>
                      </View>

                      <View style={styles.goalSection}>
                        <Text
                          style={[
                            styles.goalOptionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step3.weeklyTitle")}
                        </Text>

                        <View style={styles.grid}>
                          {WEEKLY_GOALS.map((option) => (
                            <SelectableCard
                              isSelected={weeklyGoal === option.value}
                              key={option.value}
                              label={t(
                                `onboarding.options.weekly.${option.value}`,
                              )}
                              labelStyle={styles.goalSelectableCardLabel}
                              onPress={() => {
                                setWeeklyGoal(option.value);
                              }}
                            />
                          ))}
                        </View>
                      </View>

                      <View style={styles.goalSection}>
                        <Text
                          style={[
                            styles.goalOptionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step3.dailyStepGoalLabel")}
                        </Text>

                        <View style={styles.grid}>
                          {STEP_GOALS.map((option) => (
                            <SelectableCard
                              isSelected={dailyStepGoal === option.value}
                              key={option.value}
                              label={option.label}
                              labelStyle={styles.goalSelectableCardLabel}
                              onPress={() => {
                                setDailyStepGoal(option.value);
                              }}
                            />
                          ))}
                        </View>
                      </View>
                    </>
                  ) : null}
                </View>
              </AppCard>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {stepIndex >= 0 ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: "transparent",
              borderTopColor: colors.border,
              paddingHorizontal: metrics.horizontalPadding,
            },
          ]}
        >
          <View style={styles.footerContent}>
            {stepIndex === 0 ? (
              <View style={styles.singleActionRow}>
                <AppButton
                  label={t("onboarding.buttons.continue")}
                  onPress={() => {
                    void handleContinue();
                  }}
                  style={styles.footerButton}
                />
              </View>
            ) : (
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <AppButton
                    label={t("onboarding.buttons.back")}
                    onPress={handleBack}
                    style={styles.footerButton}
                    variant="secondary"
                  />
                </View>
                <View style={styles.actionButton}>
                  <AppButton
                    label={
                      stepIndex === 2
                        ? t("onboarding.buttons.finish")
                        : t("onboarding.buttons.continue")
                    }
                    onPress={() => {
                      void handleContinue();
                    }}
                    style={styles.footerButton}
                  />
                </View>
              </View>
            )}
            <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
              {t("onboarding.footerHint")}
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
    paddingTop: 18,
  },
  container: {
    alignSelf: "center",
    width: "100%",
  },
  introContent: {
    gap: 24,
    justifyContent: "center",
  },
  introCopy: {
    gap: 8,
  },
  progressSection: {
    gap: 14,
  },
  progressLines: {
    flexDirection: "row",
    gap: 8,
  },
  progressLine: {
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressCopy: {
    gap: 8,
  },
  progressEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  progressTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  progressDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 30,
    padding: 22,
  },
  cardContent: {
    width: "100%",
  },
  sectionHeading: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  goalCardTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
  },
  namePanel: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionHeading: {
    fontSize: 16,
    fontWeight: "800",
  },
  goalOptionHeading: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionSubheading: {
    fontSize: 13,
    lineHeight: 19,
  },
  goalSection: {
    gap: 14,
  },
  helperBanner: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  helperBannerIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  selectableCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 10,
    minHeight: 132,
    padding: 16,
    width: "47%",
  },
  selectableCardCompact: {
    gap: 0,
    minHeight: 0,
    paddingVertical: 14,
  },
  selectableCardDetailed: {
    minHeight: 148,
    width: "48%",
  },
  selectableCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectableCardHeaderCompact: {
    gap: 12,
  },
  selectableCardIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  selectionIndicator: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  selectionIndicatorCompact: {
    flexShrink: 0,
  },
  selectableCardLabel: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  goalSelectableCardLabel: {
    fontWeight: "600",
  },
  selectableCardLabelCompact: {
    flex: 1,
  },
  selectableCardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    borderTopWidth: 0,
    bottom: 0,
    left: 0,
    paddingBottom: 24,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  footerContent: {
    alignSelf: "center",
    gap: 12,
    width: "100%",
  },
  footerHint: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  actionRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 12,
  },
  singleActionRow: {
    width: "100%",
  },
  actionButton: {
    flex: 1,
  },
  footerButton: {
    borderRadius: 18,
    flex: 0,
    minHeight: 56,
    width: "100%",
  },
  introLayout: {
    flex: 1,
  },
  introHero: {
    flex: 1,
    gap: 18,
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingVertical: 8,
    position: "relative",
  },
  introContentWrap: {
    flex: 1,
    gap: 18,
  },
  introGlow: {
    borderRadius: 999,
    position: "absolute",
  },
  introGlowTop: {
    height: 220,
    right: -36,
    top: 56,
    width: 220,
  },
  introGlowBottom: {
    bottom: 72,
    height: 280,
    left: -84,
    width: 280,
  },
  introBadge: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  introBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
    textAlign: "center",
  },
  introSubtitle: {
    alignSelf: "center",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 320,
    textAlign: "center",
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginVertical: 10,
  },
  introIllustration: {
    alignSelf: "center",
    height: 380,
    width: "100%",
  },
  floatingCard: {
    alignItems: "center",
    borderRadius: 18,
    elevation: 6,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    zIndex: 2,
  },
  floatingCardLeft: {
    left: 4,
    top: 42,
  },
  floatingCardRight: {
    bottom: 46,
    right: 4,
  },
  floatingCardText: {
    fontSize: 12,
    fontWeight: "800",
  },
  introButton: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  introButtonText: {
    fontSize: 16,
    fontWeight: "900",
  },
  introBenefits: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
  },
  introBenefitItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  introBenefitText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { AppTextField } from "@/components/app-text-field";
import { getAuthErrorMessage } from "@/lib/auth";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { getScreenMetrics } from "@/theme/layout";
import { type UpdateProfileRequestPayload } from "@/types/auth";
import {
  type FocusArea,
  type Gender,
  type UserIntakeProfile,
  type WeeklyGoal,
} from "@/types/domain";

const AGE_RANGE_OPTIONS: readonly UserIntakeProfile["ageRange"][] = [
  "18-29",
  "30-44",
  "45-59",
  "60+",
];

const GENDER_OPTIONS: readonly Gender[] = [
  "male",
  "female",
  "prefer_not_to_say",
];

const FOCUS_AREA_OPTIONS: readonly FocusArea[] = [
  "neck",
  "shoulder",
  "back",
  "knee",
  "mobility",
];

const WEEKLY_GOAL_OPTIONS: readonly WeeklyGoal[] = [2, 3, 4, 5];
const DAILY_STEP_GOAL_OPTIONS: readonly UserIntakeProfile["dailyStepGoal"][] = [
  3000, 5000, 7000, 9000,
];

type ChoiceChipProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

type ChoiceSectionProps = {
  children: ReactNode;
  hint?: string;
  title: string;
};

type EditableProfileForm = {
  ageRange: UserIntakeProfile["ageRange"];
  dailyStepGoal: UserIntakeProfile["dailyStepGoal"];
  focusArea: FocusArea;
  fullName: string;
  gender: Gender;
  weeklyGoal: WeeklyGoal;
};

function ChoiceChip(props: ChoiceChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.choiceChip,
        {
          backgroundColor: props.isSelected
            ? colors.accent
            : colors.surfaceMuted,
          borderColor: props.isSelected ? colors.accent : colors.border,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.choiceChipLabel,
          {
            color: props.isSelected
              ? colors.accentContrast
              : colors.textPrimary,
          },
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function ChoiceSection(props: ChoiceSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.choiceSectionTitle, { color: colors.textPrimary }]}>
        {props.title}
      </Text>
      {props.hint !== undefined ? (
        <Text
          style={[styles.choiceSectionHint, { color: colors.textSecondary }]}
        >
          {props.hint}
        </Text>
      ) : null}
      <View style={styles.choiceGrid}>{props.children}</View>
    </View>
  );
}

function buildEditableProfileForm(params: {
  fallbackFullName: string | null;
  intakeProfile: UserIntakeProfile | null;
}) {
  return {
    ageRange: params.intakeProfile?.ageRange ?? "30-44",
    dailyStepGoal: params.intakeProfile?.dailyStepGoal ?? 5000,
    focusArea: params.intakeProfile?.focusArea ?? "mobility",
    fullName: params.fallbackFullName ?? params.intakeProfile?.fullName ?? "",
    gender: params.intakeProfile?.gender ?? "prefer_not_to_say",
    weeklyGoal: params.intakeProfile?.weeklyGoal ?? 3,
  } satisfies EditableProfileForm;
}

function buildUpdateProfilePayload(form: EditableProfileForm) {
  return {
    age_range: form.ageRange,
    daily_step_goal: form.dailyStepGoal,
    focus_area: form.focusArea,
    full_name: form.fullName.trim(),
    gender: form.gender,
    weekly_goal: form.weeklyGoal,
  } satisfies UpdateProfileRequestPayload;
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { intakeProfile, profile, updateProfile } = useSession();
  const initialForm = buildEditableProfileForm({
    fallbackFullName: profile?.fullName ?? null,
    intakeProfile,
  });
  const [fullName, setFullName] = useState(initialForm.fullName);
  const [ageRange, setAgeRange] = useState(initialForm.ageRange);
  const [gender, setGender] = useState(initialForm.gender);
  const [focusArea, setFocusArea] = useState(initialForm.focusArea);
  const [weeklyGoal, setWeeklyGoal] = useState(initialForm.weeklyGoal);
  const [dailyStepGoal, setDailyStepGoal] = useState(initialForm.dailyStepGoal);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const trimmedFullName = fullName.trim();

    if (trimmedFullName.length === 0) {
      setFormError(t("profile.edit.validation.fullNameRequired"));
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);
      await updateProfile(
        buildUpdateProfilePayload({
          ageRange,
          dailyStepGoal,
          focusArea,
          fullName: trimmedFullName,
          gender,
          weeklyGoal,
        }),
      );
      router.back();
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, t("profile.edit.validation.saveFailed")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.screenContent,
            {
              gap: metrics.sectionGap,
              paddingHorizontal: metrics.horizontalPadding,
              paddingBottom: 44,
              paddingTop: 18,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons
                color={colors.textPrimary}
                name="chevron-back"
                size={18}
              />
            </Pressable>
            <View style={styles.topBarText}>
              <Text style={[styles.topBarEyebrow, { color: colors.accent }]}>
                {t("profile.edit.eyebrow")}
              </Text>
              <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>
                {t("profile.edit.title")}
              </Text>
            </View>
          </View>

          <AppCard>
            <View style={styles.formSection}>
              <AppTextField
                autoCapitalize="words"
                label={t("profile.fullName")}
                onChangeText={setFullName}
                placeholder={t("profile.edit.fullNamePlaceholder")}
                value={fullName}
              />
              <AppTextField
                editable={false}
                label={t("profile.email")}
                value={profile?.email ?? ""}
              />
            </View>
          </AppCard>

          <AppCard>
            <ChoiceSection
              hint={t("profile.edit.ageHint")}
              title={t("profile.edit.ageTitle")}
            >
              {AGE_RANGE_OPTIONS.map((option) => (
                <ChoiceChip
                  isSelected={ageRange === option}
                  key={option}
                  label={option}
                  onPress={() => setAgeRange(option)}
                />
              ))}
            </ChoiceSection>
          </AppCard>

          <AppCard>
            <ChoiceSection
              hint={t("profile.edit.genderHint")}
              title={t("profile.edit.genderTitle")}
            >
              {GENDER_OPTIONS.map((option) => (
                <ChoiceChip
                  isSelected={gender === option}
                  key={option}
                  label={t(`onboarding.options.gender.${option}`)}
                  onPress={() => setGender(option)}
                />
              ))}
            </ChoiceSection>
          </AppCard>

          <AppCard>
            <ChoiceSection
              hint={t("profile.edit.focusAreaHint")}
              title={t("profile.edit.focusAreaTitle")}
            >
              {FOCUS_AREA_OPTIONS.map((option) => (
                <ChoiceChip
                  isSelected={focusArea === option}
                  key={option}
                  label={t(`onboarding.options.focus.${option}.label`)}
                  onPress={() => setFocusArea(option)}
                />
              ))}
            </ChoiceSection>
          </AppCard>

          <AppCard>
            <ChoiceSection
              hint={t("profile.edit.weeklyGoalHint")}
              title={t("profile.edit.weeklyGoalTitle")}
            >
              {WEEKLY_GOAL_OPTIONS.map((option) => (
                <ChoiceChip
                  isSelected={weeklyGoal === option}
                  key={option}
                  label={t(`onboarding.options.weekly.${option}`)}
                  onPress={() => setWeeklyGoal(option)}
                />
              ))}
            </ChoiceSection>
          </AppCard>

          <AppCard>
            <ChoiceSection
              hint={t("profile.edit.dailyStepGoalHint")}
              title={t("profile.edit.dailyStepGoalTitle")}
            >
              {DAILY_STEP_GOAL_OPTIONS.map((option) => (
                <ChoiceChip
                  isSelected={dailyStepGoal === option}
                  key={option}
                  label={t("profile.dailyStepsValue", { count: option })}
                  onPress={() => setDailyStepGoal(option)}
                />
              ))}
            </ChoiceSection>
          </AppCard>

          {formError !== null ? (
            <Text style={[styles.formError, { color: colors.danger }]}>
              {formError}
            </Text>
          ) : null}

          <View style={styles.formActions}>
            <AppButton
              label={
                isSubmitting ? t("profile.edit.saving") : t("profile.edit.save")
              }
              disabled={isSubmitting}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  screenContent: {
    flexGrow: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  topBarText: {
    flex: 1,
    gap: 2,
  },
  topBarEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  topBarTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  formSection: {
    gap: 16,
  },
  choiceSection: {
    gap: 12,
  },
  choiceSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  choiceSectionHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  formError: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  formActions: {
    marginTop: 4,
  },
});

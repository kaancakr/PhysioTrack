import { Ionicons, Feather } from "@expo/vector-icons";
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
import { LinearGradient } from "expo-linear-gradient";

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
      style={[
        styles.dribbbleChoiceChip,
        props.isSelected && styles.dribbbleChoiceChipActive
      ]}
    >
      <Text
        style={[
          styles.dribbbleChoiceChipText,
          props.isSelected && styles.dribbbleChoiceChipTextActive
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
      <Text style={styles.dribbbleSectionTitle}>
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
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={24} color="#333" />
            </Pressable>
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={styles.dribbbleHeaderSubtitle}>{t("profile.edit.eyebrow")}</Text>
              <Text style={styles.dribbbleHeaderTitle}>{t("profile.edit.title")}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dribbbleCard}>
              <View style={styles.formSection}>
                <AppTextField
                  autoCapitalize="words"
                  label={t("profile.fullName")}
                  onChangeText={setFullName}
                  placeholder={t("profile.edit.fullNamePlaceholder")}
                  value={fullName}
                  style={styles.dribbbleInput}
                />
                <AppTextField
                  editable={false}
                  label={t("profile.email")}
                  value={profile?.email ?? ""}
                  style={styles.dribbbleInput}
                />
              </View>
            </View>

            <View style={styles.dribbbleCard}>
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
            </View>

            <View style={styles.dribbbleCard}>
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
            </View>

            <View style={styles.dribbbleCard}>
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
            </View>

            <View style={styles.dribbbleCard}>
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
            </View>

            <View style={styles.dribbbleCard}>
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
            </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    gap: 20,
    paddingBottom: 60,
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
  formSection: {
    gap: 20,
  },
  choiceSection: {
    gap: 12,
  },
  choiceSectionHint: {
    fontSize: 14,
    color: "#A0A0A0",
    lineHeight: 20,
    marginBottom: 8,
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dribbbleChoiceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dribbbleChoiceChipActive: {
    backgroundColor: "#4EAF63",
    shadowColor: "#4EAF63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dribbbleChoiceChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A0A0A0",
  },
  dribbbleChoiceChipTextActive: {
    color: "#FFF",
  },
  formError: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  formActions: {
    marginTop: 10,
  },
  dribbbleInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    borderWidth: 0,
    minHeight: 56,
    paddingHorizontal: 12,
  },
});

import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
  type ThemePreference,
  type WeeklyGoal,
} from "@/types/domain";

const THEME_OPTIONS: readonly { labelKey: string; value: ThemePreference }[] = [
  { labelKey: "profile.theme.system", value: "system" },
  { labelKey: "profile.theme.light", value: "light" },
  { labelKey: "profile.theme.dark", value: "dark" },
];

const FOCUS_AREA_LABEL_KEYS: Record<FocusArea, string> = {
  back: "onboarding.options.focus.back.label",
  knee: "onboarding.options.focus.knee.label",
  mobility: "onboarding.options.focus.mobility.label",
  neck: "onboarding.options.focus.neck.label",
  shoulder: "onboarding.options.focus.shoulder.label",
};

const WEEKLY_GOAL_LABEL_KEYS: Record<WeeklyGoal, string> = {
  2: "onboarding.options.weekly.2",
  3: "onboarding.options.weekly.3",
  4: "onboarding.options.weekly.4",
  5: "onboarding.options.weekly.5",
};

type ProfileActionItemProps = {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void | Promise<void>;
  value?: string;
};

type StatCardProps = {
  footnote: string;
  infoMessage: string;
  label: string;
  progress: number;
  progressColor: string;
  progressTrackColor: string;
  value: string;
};

function ProfileActionItem(props: ProfileActionItemProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.actionItem,
        {
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.actionIconShell,
          {
            backgroundColor: `${props.color}18`,
          },
        ]}
      >
        <Ionicons color={props.color} name={props.icon} size={18} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
          {props.label}
        </Text>
        {props.value !== undefined ? (
          <Text style={[styles.actionValue, { color: colors.textSecondary }]}>
            {props.value}
          </Text>
        ) : null}
      </View>
      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function StatCard(props: StatCardProps) {
  const { colors } = useAppTheme();

  const handleShowInfo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(props.label, props.infoMessage);
  };

  return (
    <Pressable
      delayLongPress={250}
      onLongPress={handleShowInfo}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {props.label}
        </Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
          {props.value}
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: props.progressTrackColor,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: props.progressColor,
              width: `${props.progress * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.statFootnote, { color: colors.textMuted }]}>
        {props.footnote}
      </Text>
    </Pressable>
  );
}

function getProfileInitials(
  fullName: string | null,
  email: string | undefined,
) {
  const trimmedName = fullName?.trim() ?? "";

  if (trimmedName.length > 0) {
    const nameParts = trimmedName.split(" ").filter((part) => part.length > 0);
    return nameParts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  const fallbackSource = email?.trim() ?? "";

  if (fallbackSource.length === 0) {
    return "PT";
  }

  return fallbackSource.slice(0, 2).toUpperCase();
}

function getProgressRatio(completedValue: number, totalValue: number) {
  if (totalValue <= 0) {
    return 0;
  }

  const ratio = completedValue / totalValue;

  if (ratio < 0) {
    return 0;
  }

  if (ratio > 1) {
    return 1;
  }

  return ratio;
}

function getProgressPercent(progressValue: number) {
  return `${Math.round(progressValue * 100)}%`;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, isDark, preference, setPreference } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { intakeProfile, profile, refreshProfile, signOut } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profileInitials = getProfileInitials(
    profile?.fullName ?? null,
    profile?.email,
  );
  const focusAreaLabel =
    intakeProfile === null
      ? t("profile.emptyValue")
      : t(FOCUS_AREA_LABEL_KEYS[intakeProfile.focusArea]);
  const weeklyGoalLabel =
    intakeProfile === null
      ? t("profile.emptyValue")
      : t(WEEKLY_GOAL_LABEL_KEYS[intakeProfile.weeklyGoal]);
  const dailyGoalLabel =
    intakeProfile === null
      ? t("profile.emptyValue")
      : t("profile.dailyStepsValue", { count: intakeProfile.dailyStepGoal });
  const overallProgress = profile?.overallProgress;
  const programsMetricValue =
    overallProgress === undefined
      ? t("profile.emptyValue")
      : `${overallProgress.completedProgramsCount}/${overallProgress.programsCount}`;
  const exercisesMetricValue =
    overallProgress === undefined
      ? t("profile.emptyValue")
      : `${overallProgress.completedExercisesCount}/${overallProgress.exercisesCount}`;
  const stepsMetricValue =
    overallProgress === undefined
      ? t("profile.emptyValue")
      : `${overallProgress.completedStepsCount}/${overallProgress.stepsCount}`;
  const programsProgress =
    overallProgress === undefined
      ? 0
      : getProgressRatio(
          overallProgress.completedProgramsCount,
          overallProgress.programsCount,
        );
  const exercisesProgress =
    overallProgress === undefined
      ? 0
      : getProgressRatio(
          overallProgress.completedExercisesCount,
          overallProgress.exercisesCount,
        );
  const stepsProgress =
    overallProgress === undefined
      ? 0
      : getProgressRatio(
          overallProgress.completedStepsCount,
          overallProgress.stepsCount,
        );
  const programsFootnote = t("profile.progressPercent", {
    percent: getProgressPercent(programsProgress),
  });
  const exercisesFootnote = t("profile.progressPercent", {
    percent: getProgressPercent(exercisesProgress),
  });
  const stepsFootnote = t("profile.progressPercent", {
    percent: getProgressPercent(stepsProgress),
  });

  const handleRefreshProfile = async () => {
    try {
      setIsRefreshing(true);
      await refreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleOpenEditProfile = () => {
    router.push("/(tabs)/profile/edit");
  };

  const handleSendFeedback = async () => {
    await Linking.openURL(
      "mailto:feedback@physiotrack.app?subject=PhysioTrack%20Feedback",
    );
  };

  const handleRateApp = async () => {
    await Linking.openURL("https://physiotrack.app");
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.accent }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View
        style={[
          styles.topPanel,
          {
            backgroundColor: colors.accent,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: "transparent",
              borderColor: "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.heroGlow,
              {
                backgroundColor: "rgba(255,255,255,0.14)",
              },
            ]}
          />
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderText}>
              <Text
                style={[styles.heroTitle, { color: colors.accentContrast }]}
              >
                {t("profile.title")}
              </Text>
            </View>
            <Pressable
              onPress={handleRefreshProfile}
              style={({ pressed }) => [
                styles.refreshChip,
                {
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.24)",
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons
                color={colors.accentContrast}
                name="refresh"
                size={16}
              />
              <Text
                style={[
                  styles.refreshChipLabel,
                  { color: colors.accentContrast },
                ]}
              >
                {isRefreshing ? t("profile.refreshing") : t("profile.refresh")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.profileHeaderRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderColor: "rgba(255,255,255,0.26)",
                },
              ]}
            >
              <Text style={styles.avatarText}>{profileInitials}</Text>
            </View>
            <View style={styles.profileHeaderText}>
              <Text
                style={[styles.profileName, { color: colors.accentContrast }]}
              >
                {profile?.fullName ?? t("profile.unknownUser")}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  { color: "rgba(255,255,255,0.82)" },
                ]}
              >
                {profile?.email ?? t("profile.emptyValue")}
              </Text>
              <Text
                style={[
                  styles.heroSummaryText,
                  { color: "rgba(255,255,255,0.82)" },
                ]}
              >
                {focusAreaLabel}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: profile?.isEmailVerified
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(255,255,255,0.16)",
                    },
                  ]}
                >
                  <Ionicons
                    color={colors.accentContrast}
                    name={
                      profile?.isEmailVerified
                        ? "checkmark-circle"
                        : "alert-circle"
                    }
                    size={14}
                  />
                  <Text
                    style={[
                      styles.statusBadgeLabel,
                      {
                        color: colors.accentContrast,
                      },
                    ]}
                  >
                    {profile?.isEmailVerified
                      ? t("profile.emailVerified")
                      : t("profile.emailNotVerified")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            gap: metrics.sectionGap,
            paddingHorizontal: metrics.horizontalPadding,
            paddingBottom: 160,
            paddingTop: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={[
          styles.bottomScroll,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.progressSection")}
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              footnote={programsFootnote}
              infoMessage={t("profile.programsSubtitle")}
              label={t("profile.programsMetric")}
              progress={programsProgress}
              progressColor={colors.accent}
              progressTrackColor={`${colors.accent}18`}
              value={programsMetricValue}
            />
            <StatCard
              footnote={exercisesFootnote}
              infoMessage={t("profile.exercisesSubtitle")}
              label={t("profile.exercisesMetric")}
              progress={exercisesProgress}
              progressColor={colors.success}
              progressTrackColor={`${colors.success}18`}
              value={exercisesMetricValue}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              footnote={stepsFootnote}
              infoMessage={t("profile.stepsSubtitle")}
              label={t("profile.stepsMetric")}
              progress={stepsProgress}
              progressColor={colors.accentSoft}
              progressTrackColor={`${colors.accentSoft}33`}
              value={stepsMetricValue}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              {t("profile.accountSection")}
            </Text>
            <Pressable
              onPress={handleOpenEditProfile}
              style={({ pressed }) => [
                styles.sectionEditButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons color={colors.accent} name="create-outline" size={15} />
              <Text
                style={[
                  styles.sectionEditButtonLabel,
                  { color: colors.accent },
                ]}
              >
                {t("profile.editProfile")}
              </Text>
            </Pressable>
          </View>
          <AppCard style={styles.cardSpacing}>
            <ProfileActionItem
              color={colors.accent}
              icon="person-outline"
              label={t("profile.fullName")}
              onPress={handleOpenEditProfile}
              value={profile?.fullName ?? t("profile.emptyValue")}
            />
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <ProfileActionItem
              color={colors.success}
              icon="mail-outline"
              label={t("profile.email")}
              onPress={handleOpenEditProfile}
              value={profile?.email ?? t("profile.emptyValue")}
            />
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.planSection")}
          </Text>
          <AppCard style={styles.cardSpacing}>
            <ProfileActionItem
              color={colors.accent}
              icon="body-outline"
              label={t("profile.focusArea")}
              onPress={handleOpenEditProfile}
              value={focusAreaLabel}
            />
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <ProfileActionItem
              color={colors.success}
              icon="calendar-outline"
              label={t("profile.weeklyGoal")}
              onPress={handleOpenEditProfile}
              value={weeklyGoalLabel}
            />
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <ProfileActionItem
              color={colors.accent}
              icon="footsteps-outline"
              label={t("profile.dailyStepGoal")}
              onPress={handleOpenEditProfile}
              value={dailyGoalLabel}
            />
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.appearanceSection")}
          </Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  void setPreference(option.value);
                }}
                style={({ pressed }) => [
                  styles.themeTab,
                  {
                    backgroundColor:
                      preference === option.value
                        ? colors.accent
                        : colors.surfaceMuted,
                    borderColor:
                      preference === option.value
                        ? colors.accent
                        : colors.border,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeTabLabel,
                    {
                      color:
                        preference === option.value
                          ? colors.accentContrast
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.supportSection")}
          </Text>
          <AppCard style={styles.cardSpacing}>
            <ProfileActionItem
              color={colors.accent}
              icon="chatbubble-ellipses-outline"
              label={t("profile.sendFeedback")}
              onPress={handleSendFeedback}
              value={t("profile.sendFeedbackHint")}
            />
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <ProfileActionItem
              color={colors.success}
              icon="star-outline"
              label={t("profile.rateApp")}
              onPress={handleRateApp}
              value={t("profile.rateAppHint")}
            />
          </AppCard>
        </View>

        <AppButton
          disabled={isSigningOut}
          label={isSigningOut ? t("profile.signingOut") : t("profile.signOut")}
          onPress={handleSignOut}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topPanel: {
    paddingBottom: 26,
    paddingTop: 8,
  },
  bottomScroll: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 0,
    overflow: "visible",
    paddingBottom: 18,
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  heroGlow: {
    borderRadius: 999,
    height: 150,
    position: "absolute",
    right: 16,
    top: 18,
    width: 150,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroHeaderText: {
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
  },
  refreshChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshChipLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  profileHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginTop: 20,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 34,
    borderWidth: 4,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  profileHeaderText: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  profileEmail: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionEditButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionEditButtonLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minHeight: 150,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statHeader: {
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  progressTrack: {
    borderRadius: 999,
    height: 10,
    marginTop: 18,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
    minWidth: 10,
  },
  statFootnote: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 14,
  },
  cardSpacing: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  actionItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  actionIconShell: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
  },
  themeTab: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  themeTabLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});

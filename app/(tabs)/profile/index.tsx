import * as Haptics from "expo-haptics";
import { Ionicons, Feather } from "@expo/vector-icons";
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
import { LinearGradient } from "expo-linear-gradient";

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
  infoMessage: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
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
      style={styles.statCard}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${props.iconColor}15` }]}>
        <Ionicons name={props.icon} size={20} color={props.iconColor} />
      </View>
      <Text style={styles.statValue}>{props.value}</Text>
      <Text style={styles.statLabel}>{props.label}</Text>
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

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, preference, setPreference } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { intakeProfile, profile, refreshProfile, signOut } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profileInitials = getProfileInitials(
    profile?.fullName ?? null,
    profile?.email,
  );
  
  const focusAreaLabel = intakeProfile === null ? t("profile.emptyValue") : t(FOCUS_AREA_LABEL_KEYS[intakeProfile.focusArea]);
  const weeklyGoalLabel = intakeProfile === null ? t("profile.emptyValue") : t(WEEKLY_GOAL_LABEL_KEYS[intakeProfile.weeklyGoal]);
  const dailyGoalLabel = intakeProfile === null ? t("profile.emptyValue") : t("profile.dailyStepsValue", { count: intakeProfile.dailyStepGoal });

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

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={["#E8F5E9", "#F1F8E9", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: metrics.horizontalPadding }}>
          <View style={styles.dribbbleHeader}>
            <Pressable style={styles.dribbbleHeaderButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={24} color="#333" />
            </Pressable>
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={styles.dribbbleHeaderSubtitle}>Account</Text>
              <Text style={styles.dribbbleHeaderTitle}>My Profile</Text>
            </View>
            <Pressable style={styles.dribbbleHeaderButton} onPress={() => router.push("/(tabs)/profile/edit")}>
              <Feather name="edit-3" size={20} color="#333" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: metrics.horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dribbbleProfileCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.dribbbleAvatarWrap}>
                <View style={styles.dribbbleAvatar}>
                  <Text style={styles.dribbbleAvatarText}>{profileInitials}</Text>
                </View>
                <View style={styles.dribbbleOnlineDot} />
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.dribbbleProfileName}>{profile?.fullName ?? t("profile.unknownUser")}</Text>
                <Text style={styles.dribbbleProfileEmail}>{profile?.email ?? t("profile.emptyValue")}</Text>
                <View style={styles.dribbbleStatusBadge}>
                   <Ionicons name={profile?.isEmailVerified ? "checkmark-circle" : "alert-circle"} size={12} color={profile?.isEmailVerified ? "#4CAF50" : "#FFA000"} />
                   <Text style={[styles.dribbbleStatusText, { color: profile?.isEmailVerified ? "#4CAF50" : "#FFA000" }]}>
                      {profile?.isEmailVerified ? "Verified" : "Unverified"}
                   </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.dribbbleSectionRow}>
             <Text style={styles.dribbbleSectionTitle}>Performance</Text>
             <Pressable onPress={handleRefreshProfile}>
                <Feather name="refresh-cw" size={16} color="#66BB6A" />
             </Pressable>
          </View>

          <View style={styles.statsGrid}>
            <StatCard 
              icon="apps-outline" 
              iconColor="#4CAF50" 
              label={t("profile.programsMetric")} 
              value={`${profile?.overallProgress?.completedProgramsCount ?? 0}/${profile?.overallProgress?.programsCount ?? 0}`} 
              infoMessage={t("profile.programsSubtitle")} 
            />
            <StatCard 
              icon="fitness-outline" 
              iconColor="#FF9800" 
              label={t("profile.exercisesMetric")} 
              value={`${profile?.overallProgress?.completedExercisesCount ?? 0}/${profile?.overallProgress?.exercisesCount ?? 0}`} 
              infoMessage={t("profile.exercisesSubtitle")} 
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard 
              icon="footsteps-outline" 
              iconColor="#2196F3" 
              label={t("profile.stepsMetric")} 
              value={`${profile?.overallProgress?.completedStepsCount ?? 0}/${profile?.overallProgress?.stepsCount ?? 0}`} 
              infoMessage={t("profile.stepsSubtitle")} 
            />
          </View>

          <View style={styles.dribbbleSectionRow}>
             <Text style={styles.dribbbleSectionTitle}>Settings</Text>
          </View>

          <View style={styles.actionsWrapper}>
            <ProfileActionItem color={colors.accent} icon="body-outline" label={t("profile.focusArea")} onPress={() => router.push("/(tabs)/profile/edit")} value={focusAreaLabel} />
            <ProfileActionItem color={colors.success} icon="calendar-outline" label={t("profile.weeklyGoal")} onPress={() => router.push("/(tabs)/profile/edit")} value={weeklyGoalLabel} />
            <ProfileActionItem color="#2196F3" icon="footsteps-outline" label={t("profile.dailyStepGoal")} onPress={() => router.push("/(tabs)/profile/edit")} value={dailyGoalLabel} />
          </View>

          <View style={styles.dribbbleSectionRow}>
             <Text style={styles.dribbbleSectionTitle}>{t("profile.appearanceSection")}</Text>
          </View>
          
          <View style={styles.dribbbleThemeRow}>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => void setPreference(option.value)}
                style={[
                  styles.dribbbleThemeTab,
                  preference === option.value && styles.dribbbleThemeTabActive
                ]}
              >
                <Text style={[styles.dribbbleThemeText, preference === option.value && styles.dribbbleThemeTextActive]}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.dribbbleSectionRow}>
             <Text style={styles.dribbbleSectionTitle}>{t("profile.supportSection")}</Text>
          </View>

          <View style={styles.actionsWrapper}>
             <ProfileActionItem 
               color="#FF5252" 
               icon="chatbubble-ellipses-outline" 
               label={t("profile.sendFeedback")} 
               onPress={() => Linking.openURL("mailto:feedback@physiotrack.app")} 
               value={t("profile.sendFeedbackHint")} 
             />
             <ProfileActionItem 
               color="#FFD740" 
               icon="star-outline" 
               label={t("profile.rateApp")} 
               onPress={() => Linking.openURL("https://physiotrack.app")} 
               value={t("profile.rateAppHint")} 
             />
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={isSigningOut}>
            <Feather name="log-out" size={18} color="#D32F2F" />
            <Text style={styles.signOutText}>{isSigningOut ? t("profile.signingOut") : t("profile.signOut")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 10,
    gap: 20,
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
  dribbbleProfileCard: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dribbbleAvatarWrap: {
    position: "relative",
  },
  dribbbleAvatar: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: "#E2EBD5",
    alignItems: "center",
    justifyContent: "center",
  },
  dribbbleAvatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4EAF63",
  },
  dribbbleOnlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#66BB6A",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  profileHeaderText: {
    flex: 1,
    marginLeft: 20,
  },
  dribbbleProfileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  dribbbleProfileEmail: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "600",
    marginBottom: 8,
  },
  dribbbleStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  dribbbleStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dribbbleSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  dribbbleSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFFCC",
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#A0A0A0",
    fontWeight: "600",
    marginTop: 2,
  },
  actionsWrapper: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    paddingVertical: 10,
    overflow: "hidden",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIconShell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionValue: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
    marginTop: 10,
  },
  signOutText: {
    color: "#D32F2F",
    fontWeight: "800",
    fontSize: 15,
  },
  dribbbleThemeRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF80",
    borderRadius: 20,
    padding: 6,
    gap: 6,
  },
  dribbbleThemeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 15,
  },
  dribbbleThemeTabActive: {
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dribbbleThemeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0A0A0",
  },
  dribbbleThemeTextActive: {
    color: "#333",
  },
});

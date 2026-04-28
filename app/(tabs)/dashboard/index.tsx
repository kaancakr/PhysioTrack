import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
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
import { ArtworkPanel } from "@/components/artwork-panel";
import { MetricRing } from "@/components/metric-ring";
import { StatCard } from "@/components/stat-card";
import { TrackingBars } from "@/components/tracking-bars";
import { EXERCISE_PROGRAMS } from "@/data/exercise-programs";
import { useProgress } from "@/providers/progress-provider";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";

const DASHBOARD_CATEGORIES = [
  { icon: "body-outline", label: "Neck relief" },
  { icon: "fitness-outline", label: "Shoulders" },
  { icon: "walk-outline", label: "Mobility" },
] as const;

function buildCalendarDays() {
  const today = new Date();
  const currentDay = today.getDate();

  return Array.from({ length: 7 }, (_, index) => {
    const dayNumber = currentDay - 2 + index;

    return {
      dayNumber,
      isActive: index === 2,
    };
  });
}

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { activeSession, completedSessions } = useProgress();
  const { intakeProfile, profile } = useSession();
  const router = useRouter();

  const recommendedProgram =
    EXERCISE_PROGRAMS.find(
      (program) => program.focusArea === intakeProfile?.focusArea,
    ) ?? EXERCISE_PROGRAMS[0];
  const totalMinutes = Math.round(
    completedSessions.reduce(
      (sum, item) => sum + item.completedDurationSec,
      0,
    ) / 60,
  );
  const activeProgram =
    EXERCISE_PROGRAMS.find(
      (program) => program.id === activeSession?.programId,
    ) ?? null;
  const weeklyGoal = intakeProfile?.weeklyGoal ?? 3;
  const dailyStepGoal = intakeProfile?.dailyStepGoal ?? 5000;
  const weeklyProgress = Math.min(1, completedSessions.length / weeklyGoal);
  const activeMinutesProgress = Math.min(
    1,
    totalMinutes / Math.max(20, weeklyGoal * 12),
  );
  const stepProgress = Math.min(1, (totalMinutes * 260) / dailyStepGoal);
  const calendarDays = buildCalendarDays();
  const recoveryBars = [
    {
      label: "Mobility",
      tone: colors.accent,
      value: Math.min(1, weeklyProgress + 0.12),
    },
    {
      label: "Consistency",
      tone: colors.success,
      value: activeSession !== null ? 0.76 : 0.58,
    },
    { label: "Daily steps", tone: "#FFBF69", value: stepProgress },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            {
              gap: metrics.sectionGap,
              maxWidth: metrics.contentMaxWidth,
            },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.headerBlock}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Hello,
              </Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {intakeProfile?.fullName ?? profile?.fullName ?? "Rehab friend"}
              </Text>
            </View>
            <View style={styles.topBarActions}>
              <Pressable
                style={[
                  styles.topActionButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  router.push("/(tabs)/dashboard/notifications");
                }}
              >
                <Ionicons
                  color={colors.textPrimary}
                  name="notifications-outline"
                  size={20}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.calendarSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarRow}
            >
              {calendarDays.map((day) => (
                <View
                  key={day.dayNumber}
                  style={[
                    styles.calendarItem,
                    {
                      backgroundColor: day.isActive
                        ? colors.accentSoft
                        : colors.card,
                      borderColor: day.isActive ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarNumber,
                      {
                        color: day.isActive
                          ? colors.accent
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  <View
                    style={[
                      styles.calendarDot,
                      {
                        backgroundColor: day.isActive
                          ? colors.accent
                          : "transparent",
                      },
                    ]}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionStack}>
            <View style={styles.sectionRow}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Today&apos;s session
              </Text>
              <Text style={[styles.viewAllText, { color: colors.accent }]}>
                View all
              </Text>
            </View>
            <AppCard
              style={[
                styles.heroCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.heroTopRow,
                  width < 720 ? styles.heroColumn : null,
                ]}
              >
                <View style={styles.headerBlock}>
                  <View
                    style={[
                      styles.dayBadge,
                      { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBadgeText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Day 12
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.heroProgramTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {recommendedProgram.title}
                  </Text>
                  <Text
                    style={[styles.headerCopy, { color: colors.textSecondary }]}
                  >
                    {recommendedProgram.focusAreaLabel} with calm guidance and
                    home-friendly pacing.
                  </Text>
                  <View style={styles.heroSessionMeta}>
                    <View style={styles.heroMetaChip}>
                      <Ionicons
                        color={colors.success}
                        name="time-outline"
                        size={14}
                      />
                      <Text
                        style={[
                          styles.heroMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatDuration(recommendedProgram.totalDurationSec)}
                      </Text>
                    </View>
                    <View style={styles.heroMetaChip}>
                      <Ionicons
                        color={colors.accent}
                        name="flash-outline"
                        size={14}
                      />
                      <Text
                        style={[
                          styles.heroMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {recommendedProgram.steps.length} steps
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.heroIllustration,
                    {
                      backgroundColor: colors.accent,
                      shadowColor: isDark ? "#000000" : "#8CAFE4",
                    },
                  ]}
                >
                  <View style={styles.heroAuraOuter} />
                  <View style={styles.heroAuraInner} />
                  <View
                    style={[
                      styles.heroTileLarge,
                      {
                        shadowColor: isDark ? "#000000" : "#A8B8D6",
                      },
                    ]}
                  >
                    <Ionicons
                      color={colors.accent}
                      name="accessibility"
                      size={64}
                    />
                  </View>
                  <Link asChild href={`/session/${recommendedProgram.id}`}>
                    <Pressable
                      style={[
                        styles.playButton,
                        {
                          backgroundColor: "#D8FF7D",
                          shadowColor: isDark ? "#000000" : "#B1D55D",
                        },
                      ]}
                    >
                      <Ionicons color="#1C1E21" name="play" size={28} />
                    </Pressable>
                  </Link>
                </View>
              </View>

              <View
                style={[
                  styles.heroMetaRow,
                  width < 720 ? styles.heroMetaColumn : null,
                ]}
              >
                <View style={styles.goalPill}>
                  <Text style={[styles.goalPillText, { color: colors.accent }]}>
                    Goal {weeklyGoal} sessions
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepTargetText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Step target: {dailyStepGoal.toLocaleString()}
                </Text>
              </View>
            </AppCard>
          </View>

          <View style={styles.categorySection}>
            <View style={styles.sectionRow}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Categories
              </Text>
              <Text style={[styles.viewAllText, { color: colors.accent }]}>
                View all
              </Text>
            </View>
            <View style={styles.categoryRow}>
              {DASHBOARD_CATEGORIES.map((category, index) => (
                <View key={category.label} style={styles.categoryCard}>
                  <AppCard>
                    <View style={styles.categoryContent}>
                      <View
                        style={[
                          styles.categoryIconWrap,
                          {
                            backgroundColor:
                              index === 0
                                ? colors.accentSoft
                                : index === 1
                                  ? "rgba(47, 197, 141, 0.16)"
                                  : colors.surfaceMuted,
                          },
                        ]}
                      >
                        <Ionicons
                          color={index === 1 ? colors.success : colors.accent}
                          name={category.icon}
                          size={28}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </View>
                  </AppCard>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[styles.statsRow, width < 720 ? styles.statsColumn : null]}
          >
            <StatCard
              label="Sessions done"
              value={String(completedSessions.length)}
            />
            <StatCard label="Active minutes" value={String(totalMinutes)} />
          </View>

          <AppCard
            style={[styles.insightSurface, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.insightsCard,
                width < 720 ? styles.insightsColumn : null,
              ]}
            >
              <MetricRing
                label="goal"
                progress={weeklyProgress}
                subtitle="Weekly rehab consistency"
                value={`${completedSessions.length}/${weeklyGoal}`}
              />
              <MetricRing
                label="steps"
                progress={stepProgress}
                subtitle="Movement target progress"
                value={`${Math.round(stepProgress * 100)}%`}
              />
              <View
                style={[
                  styles.barPanel,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                  Recovery balance
                </Text>
                <Text
                  style={[styles.sectionText, { color: colors.textSecondary }]}
                >
                  A quick view of your home activity, routine, and movement
                  momentum.
                </Text>
                <TrackingBars items={recoveryBars} />
              </View>
            </View>
          </AppCard>

          <ArtworkPanel
            illustration={recommendedProgram.coverImage}
            title={recommendedProgram.title}
            subtitle={recommendedProgram.description}
          />

          <AppCard
            style={[styles.planSurface, { backgroundColor: colors.card }]}
          >
            <View style={[styles.planCard, { gap: 12 }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                  Featured today
                </Text>
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                  Today&apos;s plan
                </Text>
                <Text
                  style={[styles.sectionText, { color: colors.textSecondary }]}
                >
                  {recommendedProgram.focusAreaLabel} •{" "}
                  {recommendedProgram.difficultyLabel}
                </Text>
              </View>
              <Text
                style={[styles.programMeta, { color: colors.textSecondary }]}
              >
                {formatDuration(recommendedProgram.totalDurationSec)} •{" "}
                {recommendedProgram.steps.length} steps
              </Text>
              <View style={styles.microStats}>
                <View
                  style={[
                    styles.microStatCard,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Text
                    style={[styles.microStatLabel, { color: colors.textMuted }]}
                  >
                    Focus area
                  </Text>
                  <Text
                    style={[
                      styles.microStatValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {recommendedProgram.focusAreaLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.microStatCard,
                    { backgroundColor: "rgba(47, 197, 141, 0.16)" },
                  ]}
                >
                  <Text
                    style={[styles.microStatLabel, { color: colors.textMuted }]}
                  >
                    Readiness
                  </Text>
                  <Text
                    style={[
                      styles.microStatValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {Math.round(activeMinutesProgress * 100)}%
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.buttonGroup,
                  width < 420 ? styles.buttonColumn : null,
                ]}
              >
                <Link asChild href={`/exercise/${recommendedProgram.id}`}>
                  <AppButton label="View program" />
                </Link>
                <Link asChild href={`/session/${recommendedProgram.id}`}>
                  <AppButton label="Start session" variant="secondary" />
                </Link>
              </View>
            </View>
          </AppCard>

          {activeProgram !== null ? (
            <AppCard>
              <View style={[styles.resumeCard, { gap: metrics.panelGap }]}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.textPrimary }]}
                  >
                    Resume active session
                  </Text>
                  <Text
                    style={[
                      styles.sectionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Step {(activeSession?.currentStepIndex ?? 0) + 1} of{" "}
                    {activeProgram.steps.length}
                  </Text>
                </View>
                <Link asChild href={`/session/${activeProgram.id}`}>
                  <AppButton label="Continue current session" />
                </Link>
              </View>
            </AppCard>
          ) : null}
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
    paddingTop: 12,
  },
  content: {
    alignSelf: "center",
    width: "100%",
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  topBarActions: {
    flexDirection: "row",
    gap: 10,
    flexShrink: 0,
    paddingTop: 6,
  },
  topActionButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  kickerLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  calendarSection: {
    marginTop: -4,
  },
  calendarRow: {
    gap: 12,
    paddingRight: 6,
  },
  calendarItem: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minWidth: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  calendarNumber: {
    fontSize: 18,
    fontWeight: "800",
  },
  calendarDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  sectionStack: {
    gap: 12,
  },
  heroCard: {
    borderRadius: 30,
    gap: 18,
  },
  heroTopRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 18,
    justifyContent: "space-between",
  },
  heroColumn: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  headerBlock: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  header: {
    gap: 6,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "700",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  headerCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  dayBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroProgramTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSessionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroMetaChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  heroMetaText: {
    fontSize: 14,
    fontWeight: "700",
  },
  heroIllustration: {
    alignItems: "center",
    borderRadius: 32,
    height: 220,
    justifyContent: "center",
    minWidth: 210,
    overflow: "hidden",
    position: "relative",
  },
  heroAuraOuter: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 999,
    height: 210,
    position: "absolute",
    width: 210,
  },
  heroAuraInner: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    height: 170,
    position: "absolute",
    width: 170,
  },
  heroTileLarge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 36,
    elevation: 8,
    height: 116,
    justifyContent: "center",
    shadowOffset: {
      height: 18,
      width: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    transform: [{ rotate: "-12deg" }],
    width: 116,
  },
  playButton: {
    alignItems: "center",
    borderRadius: 999,
    bottom: 26,
    elevation: 7,
    height: 64,
    justifyContent: "center",
    position: "absolute",
    right: 28,
    shadowOffset: {
      height: 16,
      width: 0,
    },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    width: 64,
  },
  heroMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroMetaColumn: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  goalPill: {
    backgroundColor: "#EAF3FF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  goalPillText: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepTargetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categorySection: {
    gap: 12,
  },
  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: "700",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
  },
  categoryContent: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  categoryIconWrap: {
    alignItems: "center",
    borderRadius: 22,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
  },
  statsColumn: {
    flexDirection: "column",
  },
  insightsCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
  },
  insightSurface: {
    borderColor: "transparent",
  },
  insightsColumn: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  barPanel: {
    borderRadius: 24,
    flex: 1,
    gap: 12,
    padding: 12,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  planCard: {
    width: "100%",
  },
  planSurface: {
    borderColor: "transparent",
  },
  programMeta: {
    fontSize: 14,
    fontWeight: "700",
  },
  microStats: {
    flexDirection: "row",
    gap: 10,
  },
  microStatCard: {
    borderRadius: 16,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  microStatLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  microStatValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  buttonColumn: {
    flexDirection: "column",
  },
  resumeCard: {
    width: "100%",
  },
});

import { FOCUS_FILTERS } from "@/data/exercise-programs";
import { getAuthErrorMessage, requestAuthJson } from "@/lib/auth";
import { parseProgramsPayload, type ProgramSummary } from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type FocusArea } from "@/types/domain";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FocusFilter = FocusArea | "all";

export default function ProgramsListScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const metrics = getScreenMetrics(width);

  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadPrograms = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const searchParams = new URLSearchParams({
          search: query.trim(),
          focus_area: focusFilter === "all" ? "" : focusFilter,
        });
        const path = `/api/auth/programs/?${searchParams.toString()}`;
        const payload = await requestAuthJson<unknown>(path, {
          method: "GET",
        });
        const nextPrograms = parseProgramsPayload(payload);
        setPrograms(nextPrograms);
      } catch (error) {
        console.error("Programs loading error", error);
        setPrograms([]);
        setErrorMessage(
          getAuthErrorMessage(error, "Programs could not be loaded."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPrograms();
  }, [focusFilter, isFocused, query]);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: metrics.horizontalPadding }}>
          <View style={styles.dribbbleHeader}>
            <View style={styles.dribbbleHeaderCenter}>
              <Text
                style={[
                  styles.dribbbleHeaderSubtitle,
                  { color: colors.accent },
                ]}
              >
                Collection
              </Text>
              <Text
                style={[
                  styles.dribbbleHeaderTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Programs
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dribbbleCategoriesContent}
            style={styles.dribbbleCategories}
          >
            {FOCUS_FILTERS.map((filter) => {
              const isSelected = focusFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setFocusFilter(filter.value)}
                  style={[
                    styles.dribbbleCategoryPill,
                    {
                      backgroundColor: isSelected
                        ? colors.card
                        : colors.card + "CC",
                      borderColor: isSelected
                        ? colors.accentSoft
                        : colors.border,
                    },
                    isSelected && styles.dribbbleCategoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dribbbleCategoryText,
                      {
                        color: isSelected
                          ? colors.textPrimary
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: metrics.horizontalPadding },
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
            <View
              style={[
                styles.dribbbleSearchWrapper,
                {
                  backgroundColor: colors.card + "CC",
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                onChangeText={setQuery}
                placeholder="Find a program..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.dribbbleSearchInput,
                  { color: colors.textPrimary },
                ]}
                value={query}
              />
              <View
                style={[
                  styles.dribbbleSearchIcon,
                  { backgroundColor: colors.accent + "14" },
                ]}
              >
                <Feather name="sliders" size={18} color={colors.accent} />
              </View>
            </View>

            <View style={styles.programList}>
              {isLoading ? (
                <ActivityIndicator
                  color={colors.accent}
                  size="large"
                  style={styles.loader}
                />
              ) : (
                programs.map((program) => (
                  <Link
                    key={program.id}
                    asChild
                    href={{
                      pathname: "/programs/[programId]",
                      params: {
                        difficultyLabel: program.difficultyLabel ?? "",
                        focusAreaLabel: program.focusAreaLabel ?? "",
                        programId: program.id,
                        programTitle: program.title,
                      },
                    }}
                  >
                    <Pressable>
                      <View
                        style={[
                          styles.dribbbleProgramCard,
                          {
                            backgroundColor: colors.card + "D9",
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.dribbbleProgramImageWrap}>
                          <View
                            style={[
                              styles.dribbbleImagePlaceholder,
                              { backgroundColor: colors.accent + "15" },
                            ]}
                          >
                            <Ionicons
                              name="fitness"
                              size={32}
                              color={colors.accent}
                            />
                          </View>
                        </View>
                        <View style={styles.dribbbleProgramInfo}>
                          <Text
                            style={[
                              styles.dribbbleProgramSubtitle,
                              { color: colors.accentSoft },
                            ]}
                          >
                            {program.focusAreaLabel ?? "Focus"} •{" "}
                            {program.difficultyLabel ?? "All levels"}
                          </Text>
                          <Text
                            style={[
                              styles.dribbbleProgramTitle,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {program.title}
                          </Text>
                          <View style={styles.dribbbleProgramMeta}>
                            <View style={styles.dribbbleMetaItem}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.dribbbleMetaText,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {formatDuration(program.totalDurationSec)}
                              </Text>
                            </View>
                            <View style={styles.dribbbleMetaItem}>
                              <Ionicons
                                name="flash-outline"
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.dribbbleMetaText,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {program.progress.exercisesCount} exercises
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.dribbbleArrowBtn,
                            { backgroundColor: colors.surfaceMuted },
                          ]}
                        >
                          <Feather
                            name="arrow-right"
                            size={18}
                            color={colors.textPrimary}
                          />
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                ))
              )}
              {!isLoading && programs.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text
                    style={[styles.emptyStateText, { color: colors.textMuted }]}
                  >
                    {errorMessage ?? "No programs found."}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 100, paddingTop: 10 },
  content: { alignSelf: "center", width: "100%" },
  loader: { marginTop: 40 },

  // --- Dribbble Layout Styles ---
  dribbbleHeader: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 14,
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
  },
  dribbbleCategories: {
    marginBottom: 20,
  },
  dribbbleCategoriesContent: {
    columnGap: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  dribbbleCategoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  dribbbleCategoryPillActive: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dribbbleCategoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dribbbleSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 20,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dribbbleSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  dribbbleSearchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  programList: {
    gap: 16,
    marginTop: 10,
  },
  dribbbleProgramCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dribbbleProgramImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 20,
    overflow: "hidden",
  },
  dribbbleImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dribbbleProgramInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  dribbbleProgramSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dribbbleProgramTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  dribbbleProgramMeta: {
    flexDirection: "row",
    gap: 12,
  },
  dribbbleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dribbbleMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dribbbleArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
  },
});

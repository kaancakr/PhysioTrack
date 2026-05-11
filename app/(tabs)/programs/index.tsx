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

import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { FOCUS_FILTERS } from "@/data/exercise-programs";
import { getAuthErrorMessage, requestAuthJson } from "@/lib/auth";
import {
  parseProgramsPayload,
  type ProgramSummary,
} from "@/lib/exercise-flow";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type FocusArea } from "@/types/domain";

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
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Exercise programs
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Search and filter programs, then open one to browse its exercises.
            </Text>
          </View>

          <AppCard>
            <View style={[styles.filterPanel, { gap: metrics.panelGap }]}>
              <TextInput
                onChangeText={setQuery}
                placeholder="Search by name or focus area"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={query}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {FOCUS_FILTERS.map((filter) => {
                    const isSelected = focusFilter === filter.value;

                    return (
                      <Pressable
                        key={filter.value}
                        onPress={() => setFocusFilter(filter.value)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? colors.accentSoft
                              : colors.surfaceMuted,
                            borderColor: isSelected
                              ? colors.accent
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterLabel,
                            {
                              color: isSelected
                                ? colors.accent
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </AppCard>

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
                    <AppCard>
                      <View style={styles.programCard}>
                        <ArtworkPanel
                          illustration={program.illustration}
                          subtitle={`${program.focusAreaLabel ?? "Exercise program"} • ${program.difficultyLabel ?? "Guided"} • ${formatDuration(program.totalDurationSec)} • ${program.progress.progressLabel}`}
                          title={program.title}
                          withoutCard
                        />
                      </View>
                    </AppCard>
                  </Pressable>
                </Link>
              ))
            )}
            {!isLoading && programs.length === 0 ? (
              <Text
                style={[
                  styles.emptyState,
                  { color: colors.textSecondary },
                ]}
              >
                {errorMessage ?? "No programs found."}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32, paddingTop: 12 },
  content: { alignSelf: "center", width: "100%" },
  header: { gap: 8 },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22 },
  filterPanel: { width: "100%" },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterRow: { flexDirection: "row", gap: 10 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterLabel: { fontSize: 14, fontWeight: "700" },
  programList: { gap: 14 },
  programCard: { gap: 12, width: "100%" },
  loader: { marginTop: 20 },
  emptyState: { marginTop: 20, textAlign: "center" },
});

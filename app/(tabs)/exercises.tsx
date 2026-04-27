import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppCard } from "@/components/app-card";
import { ArtworkPanel } from "@/components/artwork-panel";
import { EXERCISE_PROGRAMS, FOCUS_FILTERS } from "@/data/exercise-programs";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type FocusArea } from "@/types/domain";

type FocusFilter = FocusArea | "all";

export default function ExercisesScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const [query, setQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPrograms = EXERCISE_PROGRAMS.filter((program) => {
    const matchesFocus = focusFilter === "all" || program.focusArea === focusFilter;
    const matchesSearch =
      normalizedQuery.length === 0 ||
      program.title.toLowerCase().includes(normalizedQuery) ||
      program.description.toLowerCase().includes(normalizedQuery) ||
      program.focusAreaLabel.toLowerCase().includes(normalizedQuery);

    return matchesFocus && matchesSearch;
  });

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Exercise programs</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No-equipment physiotherapy routines organized for home use.
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
                      onPress={() => {
                        setFocusFilter(filter.value);
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected ? colors.accentSoft : colors.surfaceMuted,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterLabel,
                          {
                            color: isSelected ? colors.accent : colors.textSecondary,
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
          {filteredPrograms.map((program) => (
            <Link asChild href={`/exercise/${program.id}`} key={program.id}>
              <Pressable>
                <AppCard>
                  <View style={styles.programCard}>
                    <ArtworkPanel
                      illustration={program.coverImage}
                      kicker={null}
                      subtitle={`${program.focusAreaLabel} • ${formatDuration(program.totalDurationSec)} • ${program.steps.length} steps`}
                      title={program.title}
                      withoutCard
                    />
                    <Text style={[styles.programDescription, { color: colors.textSecondary }]}>
                      {program.description}
                    </Text>
                  </View>
                </AppCard>
              </Pressable>
            </Link>
          ))}
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
    paddingTop: 12,
  },
  content: {
    alignSelf: "center",
    width: "100%",
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  filterPanel: {
    width: "100%",
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  programList: {
    gap: 14,
  },
  programCard: {
    gap: 12,
    width: "100%",
  },
  programDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});

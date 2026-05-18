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
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

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
    <View style={styles.safeArea}>
      <LinearGradient
        colors={["#E8F5E9", "#F1F8E9", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: metrics.horizontalPadding }}>
          <View style={styles.dribbbleHeader}>
            <View style={{ width: 44 }} />
            <View style={styles.dribbbleHeaderCenter}>
              <Text style={styles.dribbbleHeaderSubtitle}>Collection</Text>
              <Text style={styles.dribbbleHeaderTitle}>Programs</Text>
            </View>
            <Pressable style={styles.dribbbleHeaderButton}>
              <Feather name="search" size={20} color="#333" />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dribbbleCategories}>
            {FOCUS_FILTERS.map((filter) => {
              const isSelected = focusFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setFocusFilter(filter.value)}
                  style={[styles.dribbbleCategoryPill, isSelected && styles.dribbbleCategoryPillActive]}
                >
                  <Text style={[styles.dribbbleCategoryText, isSelected && styles.dribbbleCategoryTextActive]}>
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
            <View style={styles.dribbbleSearchWrapper}>
              <TextInput
                onChangeText={setQuery}
                placeholder="Find a program..."
                placeholderTextColor="#A0A0A0"
                style={styles.dribbbleSearchInput}
                value={query}
              />
              <View style={styles.dribbbleSearchIcon}>
                <Feather name="sliders" size={18} color="#4EAF63" />
              </View>
            </View>

            <View style={styles.programList}>
              {isLoading ? (
                <ActivityIndicator
                  color="#4EAF63"
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
                      <View style={styles.dribbbleProgramCard}>
                        <View style={styles.dribbbleProgramImageWrap}>
                           <View style={[styles.dribbbleImagePlaceholder, { backgroundColor: '#4EAF63' + '15' }]}>
                             <Ionicons name="fitness" size={32} color="#4EAF63" />
                           </View>
                        </View>
                        <View style={styles.dribbbleProgramInfo}>
                          <Text style={styles.dribbbleProgramSubtitle}>
                            {program.focusAreaLabel ?? "Focus"} • {program.difficultyLabel ?? "All levels"}
                          </Text>
                          <Text style={styles.dribbbleProgramTitle}>{program.title}</Text>
                          <View style={styles.dribbbleProgramMeta}>
                             <View style={styles.dribbbleMetaItem}>
                                <Ionicons name="time-outline" size={14} color="#A0A0A0" />
                                <Text style={styles.dribbbleMetaText}>{formatDuration(program.totalDurationSec)}</Text>
                             </View>
                             <View style={styles.dribbbleMetaItem}>
                                <Ionicons name="flash-outline" size={14} color="#A0A0A0" />
                                <Text style={styles.dribbbleMetaText}>{program.progress.exercisesCount} exercises</Text>
                             </View>
                          </View>
                        </View>
                        <View style={styles.dribbbleArrowBtn}>
                           <Feather name="arrow-right" size={18} color="#333" />
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                ))
              )}
              {!isLoading && programs.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
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
  dribbbleCategories: {
    marginBottom: 20,
  },
  dribbbleCategoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#FFFFFF80",
  },
  dribbbleCategoryPillActive: {
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dribbbleCategoryText: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  dribbbleCategoryTextActive: {
    color: "#333",
  },
  dribbbleSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFFCC",
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dribbbleSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  dribbbleSearchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
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
    backgroundColor: "#FFFFFFCC",
    borderRadius: 30,
    padding: 16,
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
    color: "#C5E1A5",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dribbbleProgramTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
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
    color: "#A0A0A0",
    fontWeight: "600",
  },
  dribbbleArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
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
    color: "#A0A0A0",
    textAlign: "center",
  },
});

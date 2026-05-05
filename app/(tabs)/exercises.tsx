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
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type FocusArea } from "@/types/domain";

type FocusFilter = FocusArea | "all";

export default function ExercisesScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const { session } = useSession(); // Token kullanımı için session eklendi
  const metrics = getScreenMetrics(width);

  // State Yönetimi
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");

  // API'den Veri Çekme
  useEffect(() => {
    const loadPrograms = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: query.trim(),
          focus_area: focusFilter === "all" ? "" : focusFilter,
        });

        const headers: Record<string, string> = {
          Accept: "application/json",
        };

        if (session?.tokenPair?.access) {
          headers["Authorization"] = `Bearer ${session.tokenPair.access}`;
        }

        const response = await fetch(
          `/api/auth/programs/?${params.toString()}`,
          {
            method: "GET",
            headers,
          },
        );

        if (!response.ok) {
          throw new Error(`API hatası: ${response.status}`);
        }

        const data = await response.json();

        // Django "results" içinde dönüyorsa onu al, yoksa direkt datayı kullan
        setPrograms(data.results || data);
      } catch (error) {
        console.error("Program yükleme hatası:", error);
        setPrograms([]); // Hata durumunda listeyi temizle
      } finally {
        setIsLoading(false);
      }
    };

    loadPrograms();
  }, [query, focusFilter, session?.tokenPair?.access]); // Token değiştiğinde de tetiklenmeli

  return (
    <SafeAreaView
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
            { gap: metrics.sectionGap, maxWidth: metrics.contentMaxWidth },
          ]}
        >
          {/* Başlık Bölümü */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Exercise programs
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              No-equipment physiotherapy routines organized for home use.
            </Text>
          </View>

          {/* Filtreleme Paneli */}
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

          {/* Program Listesi */}
          <View style={styles.programList}>
            {isLoading ? (
              <ActivityIndicator
                color={colors.accent}
                size="large"
                style={{ marginTop: 20 }}
              />
            ) : (
              programs.map((program, index) => (
                <Link
                  asChild
                  href={`/exercise/${program.id}`}
                  key={program.id?.toString() || index.toString()}
                >
                  <Pressable>
                    <AppCard>
                      <View style={styles.programCard}>
                        <ArtworkPanel
                          illustration={
                            program.cover_image || program.coverImage
                          }
                          kicker={null}
                          subtitle={`${program.focus_area_label || program.focusAreaLabel || ""} • ${formatDuration(program.total_duration_sec || program.totalDurationSec || 0)} • ${program.steps?.length || 0} steps`}
                          title={program.title}
                          withoutCard
                        />
                        {program.description && (
                          <Text
                            style={[
                              styles.programDescription,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {program.description}
                          </Text>
                        )}
                      </View>
                    </AppCard>
                  </Pressable>
                </Link>
              ))
            )}
            {!isLoading && programs.length === 0 && (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.textSecondary,
                  marginTop: 20,
                }}
              >
                No programs found.
              </Text>
            )}
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
  programDescription: { fontSize: 14, lineHeight: 22 },
});

import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/app-card";
import { useAppTheme } from "@/providers/theme-provider";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard(props: StatCardProps) {
  const { colors } = useAppTheme();
  const isSessionsCard = props.label === "Sessions done";
  const highlightBackground = isSessionsCard ? colors.accentSoft : "rgba(47, 197, 141, 0.16)";
  const highlightColor = isSessionsCard ? colors.accent : colors.success;

  return (
    <View style={styles.container}>
      <AppCard>
        <View style={[styles.content, { backgroundColor: highlightBackground }]}>
          <Text style={[styles.value, { color: highlightColor }]}>{props.value}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{props.label}</Text>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    borderRadius: 20,
    gap: 10,
    padding: 12,
  },
  value: {
    fontSize: 32,
    fontWeight: "800",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
});

import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type TrackingBarItem = {
  label: string;
  tone: string;
  value: number;
};

type TrackingBarsProps = {
  items: TrackingBarItem[];
};

export function TrackingBars(props: TrackingBarsProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {props.items.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
            <Text style={[styles.percent, { color: colors.textSecondary }]}>
              {Math.round(item.value * 100)}%
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: item.tone,
                  width: `${Math.max(10, item.value * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  percent: {
    fontSize: 13,
    fontWeight: "700",
  },
  track: {
    borderRadius: 999,
    height: 12,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
    height: "100%",
  },
});

import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type MetricRingProps = {
  label: string;
  progress: number;
  subtitle: string;
  value: string;
};

function clamp(value: number) {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function MetricRing(props: MetricRingProps) {
  const { colors } = useAppTheme();
  const progress = clamp(props.progress);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.ringTrack,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.accentSoft,
          },
        ]}
      >
        <View
          style={[
            styles.ringProgress,
            {
              borderColor: colors.accent,
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />
        <View style={[styles.ringInner, { backgroundColor: colors.card }]}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{props.value}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>{props.label}</Text>
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{props.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
  },
  ringTrack: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 10,
    height: 132,
    justifyContent: "center",
    width: 132,
  },
  ringProgress: {
    borderRadius: 999,
    borderTopColor: "transparent",
    borderWidth: 10,
    height: 132,
    position: "absolute",
    width: 132,
  },
  ringInner: {
    alignItems: "center",
    borderRadius: 999,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});

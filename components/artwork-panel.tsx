import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/app-card";
import { useAppTheme } from "@/providers/theme-provider";
import { type ExerciseIllustration } from "@/types/domain";

type ArtworkPanelProps = {
  illustration: ExerciseIllustration;
  kicker?: string | null;
  subtitle: string;
  title: string;
  withoutCard?: boolean;
};

function ArtworkPanelContent(props: ArtworkPanelProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.illustration,
          {
            backgroundColor: props.illustration.background,
          },
        ]}
      >
        <View
          style={[
            styles.illustrationHalo,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.24)",
            },
          ]}
        />
        <View
          style={[
            styles.illustrationDisc,
            {
              backgroundColor: isDark
                ? "rgba(11, 20, 38, 0.24)"
                : "rgba(22, 129, 255, 0.12)",
            },
          ]}
        />
        <View style={styles.floatingBubbleLarge} />
        <View style={styles.floatingBubbleSmall} />
        <View
          style={[
            styles.iconTile,
            {
              shadowColor: isDark ? "#000000" : "#A7B5D4",
            },
          ]}
        >
          <Ionicons
            color={props.illustration.tint}
            name={props.illustration.icon}
            size={58}
          />
        </View>
      </View>
      <View style={styles.copy}>
        {props.kicker !== null ? (
          <Text style={[styles.kicker, { color: props.illustration.tint }]}>
            {props.kicker ?? "Daily spotlight"}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {props.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {props.subtitle}
        </Text>
      </View>
    </View>
  );
}

export function ArtworkPanel(props: ArtworkPanelProps) {
  if (props.withoutCard) {
    return <ArtworkPanelContent {...props} />;
  }

  return (
    <AppCard>
      <ArtworkPanelContent {...props} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  illustration: {
    alignItems: "center",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 168,
    overflow: "hidden",
    padding: 20,
    position: "relative",
  },
  illustrationHalo: {
    borderRadius: 999,
    height: 220,
    position: "absolute",
    width: 220,
  },
  illustrationDisc: {
    borderRadius: 999,
    height: 180,
    position: "absolute",
    width: 180,
  },
  floatingBubbleLarge: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    height: 42,
    position: "absolute",
    right: 26,
    top: 22,
    width: 42,
  },
  floatingBubbleSmall: {
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: 999,
    bottom: 24,
    height: 20,
    left: 34,
    position: "absolute",
    width: 20,
  },
  iconTile: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    elevation: 6,
    justifyContent: "center",
    minHeight: 120,
    minWidth: 120,
    shadowOffset: {
      height: 18,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    transform: [{ rotate: "-8deg" }],
  },
  copy: {
    gap: 10,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
  },
});

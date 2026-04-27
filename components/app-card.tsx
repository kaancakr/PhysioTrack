import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard(props: AppCardProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: isDark ? "#030712" : "#A9B9DC",
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    shadowOffset: {
      height: 14,
      width: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
});

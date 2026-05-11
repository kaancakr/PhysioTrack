import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type AppBackButtonProps = {
  label: string;
  onPress: () => void;
};

export function AppBackButton(props: AppBackButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      >
        <Ionicons color={colors.textPrimary} name="chevron-back" size={18} />
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingRight: 18,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
});

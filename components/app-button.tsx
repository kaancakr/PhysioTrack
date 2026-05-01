import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  ViewStyle,
} from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "primary" | "secondary";
};

export function AppButton(props: AppButtonProps) {
  const { colors } = useAppTheme();
  const isPrimary = props.variant !== "secondary";
  const isDisabled = props.disabled === true;

  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        styles.button,
        {
          backgroundColor: isPrimary
            ? isDisabled
              ? colors.accentSoft
              : colors.accent
            : colors.surfaceMuted,
          borderColor: isPrimary
            ? isDisabled
              ? colors.accentSoft
              : colors.accent
            : colors.border,
          opacity: isDisabled && !isPrimary ? 0.6 : 1,
        },
        props.style,
      ]}
    >
      <Text
        style={[
          styles.label,
          props.labelStyle,
          {
            color: isPrimary
              ? colors.accentContrast
              : colors.textPrimary,
          },
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
});

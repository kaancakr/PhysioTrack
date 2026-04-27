import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type AppTextFieldProps = TextInputProps & {
  label: string;
};

export function AppTextField(props: AppTextFieldProps) {
  const { colors } = useAppTheme();
  const { label, ...textInputProps } = props;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
        {...textInputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

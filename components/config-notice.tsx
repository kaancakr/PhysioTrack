import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";

type ConfigNoticeProps = {
  message: string | null;
};

export function ConfigNotice(props: ConfigNoticeProps) {
  const { colors } = useAppTheme();

  if (props.message === null) {
    return null;
  }

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: colors.accentSoft,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.textPrimary }]}>{props.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
  },
});

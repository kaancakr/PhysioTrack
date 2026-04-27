import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";

type AppleAuthButtonProps = {
  buttonType: AppleAuthentication.AppleAuthenticationButtonType;
  disabled?: boolean;
  onError?: (message: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

function getAppleAuthErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  ) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown Apple Sign-In error occurred.";
}

export function AppleAuthButton(props: AppleAuthButtonProps) {
  const { colors, isDark } = useAppTheme();
  const { isAppleAuthAvailable, signInWithApple } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (Platform.OS !== "ios" || !isAppleAuthAvailable) {
    return null;
  }

  const handlePress = async () => {
    try {
      props.onError?.(null);
      setIsSubmitting(true);
      await signInWithApple();
    } catch (error) {
      props.onError?.(getAppleAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, props.style]}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        buttonType={props.buttonType}
        cornerRadius={18}
        onPress={() => {
          void handlePress();
        }}
        style={[
          styles.button,
          {
            opacity: props.disabled || isSubmitting ? 0.6 : 1,
          },
        ]}
      />
      <Text style={[styles.caption, { color: colors.textMuted }]}>
        Apple will share your email and, on first sign-in only, your name.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  button: {
    height: 54,
    width: "100%",
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

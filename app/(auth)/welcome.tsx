import * as AppleAuthentication from "expo-apple-authentication";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppleAuthButton } from "@/components/apple-auth-button";
import { useAppTheme } from "@/providers/theme-provider";

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const [appleAuthError, setAppleAuthError] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {t("welcome.eyebrow")}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t("welcome.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("welcome.subtitle")}
          </Text>
        </View>

        <Image
          source={require("@/assets/images/welcome-illustration.png")}
          style={styles.illustration}
          resizeMode="contain"
        />

        <View style={styles.actions}>
          <AppleAuthButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            onError={setAppleAuthError}
          />
          {appleAuthError !== null ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {appleAuthError}
            </Text>
          ) : null}
          <Link asChild href="/(auth)/signup">
            <AppButton label={t("welcome.createAccount")} />
          </Link>
          <Link asChild href="/(auth)/login">
            <AppButton
              label={t("welcome.alreadyHaveAccount")}
              labelStyle={styles.secondaryActionButtonLabel}
              style={styles.secondaryActionButton}
              variant="secondary"
            />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 20,
  },
  hero: {
    gap: 16,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  secondaryActionButton: {
    opacity: 0.72,
  },
  secondaryActionButtonLabel: {
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  illustration: {
    width: "100%",
    height: 340,
    borderRadius: 24,
  },
});

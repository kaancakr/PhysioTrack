import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { AppTextField } from "@/components/app-text-field";
import { AppleAuthButton } from "@/components/apple-auth-button";
import { ConfigNotice } from "@/components/config-notice";
import { getAuthErrorMessage } from "@/lib/auth";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { getScreenMetrics } from "@/theme/layout";

export default function SignupScreen() {
  const { colors } = useAppTheme();
  const { configurationError, signUp } = useSession();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setFormError(null);
      setSuccessMessage(null);
      setIsSubmitting(true);
      await signUp(email.trim(), password);
      router.push("/(auth)/verify-email");
    } catch (error) {
      setFormError(getAuthErrorMessage(error, t("auth.errors.unknownSignUp")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <LinearGradient
          colors={[`${colors.accent}24`, `${colors.background}00`]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.glowOrb, styles.glowOrbPrimary]}
        />
        <LinearGradient
          colors={[`${colors.accentSoft}16`, `${colors.background}00`]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.glowOrb, styles.glowOrbSecondary]}
        />
        <View style={styles.sparkleTopLeft}>
          <Feather color={`${colors.accent}AA`} name="star" size={16} />
        </View>
        <View style={styles.sparkleBottomRight}>
          <Feather color={`${colors.textMuted}88`} name="sun" size={15} />
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: metrics.horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentInner,
              {
                gap: metrics.sectionGap,
                maxWidth: metrics.contentMaxWidth,
              },
            ]}
          >
            <View style={styles.heroPanel}>
              <View
                style={[
                  styles.eyebrowPill,
                  {
                    backgroundColor: `${colors.accent}16`,
                    borderColor: `${colors.accent}22`,
                  },
                ]}
              >
                <Feather color={colors.accent} name="heart" size={14} />
                <Text style={[styles.eyebrowText, { color: colors.accent }]}>
                  {t("auth.signup.eyebrow")}
                </Text>
              </View>

              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t("auth.signup.title")}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {t("auth.signup.subtitle")}
                </Text>
              </View>

              <View style={styles.featureRow}>
                <View
                  style={[
                    styles.featureChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather color={colors.accent} name="user-check" size={14} />
                  <Text
                    style={[
                      styles.featureText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("auth.signup.featureProfileReady")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.featureChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather color={colors.accent} name="mail" size={14} />
                  <Text
                    style={[
                      styles.featureText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("auth.signup.featureEmailVerification")}
                  </Text>
                </View>
              </View>
            </View>

            <AppCard style={styles.signupCard}>
              <View style={styles.formShell}>
                <View style={styles.form}>
                  <ConfigNotice message={configurationError} />
                  <AppTextField
                    autoCapitalize="none"
                    keyboardType="email-address"
                    label={t("auth.fields.emailLabel")}
                    onChangeText={setEmail}
                    placeholder={t("auth.fields.emailPlaceholder")}
                    value={email}
                  />
                  <AppTextField
                    label={t("auth.fields.passwordLabel")}
                    onChangeText={setPassword}
                    placeholder={t("auth.signup.passwordPlaceholder")}
                    secureTextEntry
                    value={password}
                  />
                  {formError !== null ? (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {formError}
                    </Text>
                  ) : null}
                  {successMessage !== null ? (
                    <Text
                      style={[styles.successText, { color: colors.success }]}
                    >
                      {successMessage}
                    </Text>
                  ) : null}
                  <AppButton
                    disabled={isSubmitting}
                    label={
                      isSubmitting
                        ? t("auth.signup.submittingLabel")
                        : t("auth.signup.submitLabel")
                    }
                    onPress={handleSubmit}
                  />
                  <AppleAuthButton
                    buttonType={
                      AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                    }
                    disabled={isSubmitting}
                    onError={setFormError}
                  />
                </View>
              </View>
            </AppCard>

            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t("auth.signup.footerPrefix")}{" "}
              <Link
                href="/(auth)/login"
                style={[styles.footerLink, { color: colors.accent }]}
              >
                {t("auth.signup.footerLink")}
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    borderRadius: 999,
    position: "absolute",
  },
  glowOrbPrimary: {
    height: 220,
    left: -56,
    top: 72,
    width: 220,
  },
  glowOrbSecondary: {
    bottom: 140,
    height: 180,
    right: -54,
    width: 180,
  },
  sparkleTopLeft: {
    left: 42,
    position: "absolute",
    top: 126,
  },
  sparkleBottomRight: {
    bottom: 178,
    position: "absolute",
    right: 40,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 20,
  },
  contentInner: {
    alignSelf: "center",
    width: "100%",
  },
  heroPanel: {
    gap: 16,
  },
  eyebrowPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyebrowText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 560,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  signupCard: {
    padding: 0,
  },
  formShell: {
    gap: 18,
    padding: 18,
  },
  summaryCardWrapper: {
    gap: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  summaryMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  successText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  footerText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  footerLink: {
    fontWeight: "700",
  },
});

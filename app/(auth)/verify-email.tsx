import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { ConfigNotice } from "@/components/config-notice";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";

export default function VerifyEmailScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    configurationError,
    pendingSignupEmail,
    resendSignupCode,
    verifySignupCode,
  } = useSession();
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    try {
      setFormError(null);
      setSuccessMessage(null);
      setIsSubmitting(true);
      await verifySignupCode(code);
      setSuccessMessage(t("auth.verifyEmail.verifiedSuccess"));
      setIsSubmitting(false);
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.errors.unknownVerify");
      setFormError(message);
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setFormError(null);
      setSuccessMessage(null);
      setIsResending(true);
      await resendSignupCode();
      setSuccessMessage(t("auth.verifyEmail.resendSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.errors.unknownResend");
      setFormError(message);
    } finally {
      setIsResending(false);
      setCountdown(45);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + "15" }]}>
              <Feather name="mail" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t("auth.verifyEmail.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("auth.verifyEmail.subtitle")}
            </Text>
          </View>

          <AppCard>
            <View style={styles.form}>
              <ConfigNotice message={configurationError} />
              {pendingSignupEmail !== null ? (
                <Text style={[styles.emailText, { color: colors.textSecondary }]}>
                  {t("auth.verifyEmail.codeSentTo", { email: pendingSignupEmail })}
                </Text>
              ) : null}
              <View style={styles.codeInputContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeBox,
                      {
                        borderColor: code.length === index ? colors.accent : colors.border,
                        backgroundColor: colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={[styles.codeText, { color: colors.textPrimary }]}>
                      {code[index] || ""}
                    </Text>
                  </View>
                ))}
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={setCode}
                  style={styles.hiddenInput}
                  value={code}
                />
              </View>
              {formError !== null ? (
                <Text style={[styles.feedbackText, { color: colors.danger }]}>{formError}</Text>
              ) : null}
              {successMessage !== null ? (
                <Text style={[styles.feedbackText, { color: colors.success }]}>
                  {successMessage}
                </Text>
              ) : null}

              <AppButton
                disabled={code.length < 6 || isSubmitting}
                label={
                  isSubmitting
                    ? t("auth.verifyEmail.verifyingLabel")
                    : t("auth.verifyEmail.verifyLabel")
                }
                onPress={handleVerify}
              />

              <AppButton
                disabled={isResending || countdown > 0}
                label={
                  isResending
                    ? t("auth.verifyEmail.sendingLabel")
                    : countdown > 0
                    ? t("auth.verifyEmail.resendWaitLabel", { seconds: countdown })
                    : t("auth.verifyEmail.resendLabel")
                }
                onPress={handleResend}
                variant="secondary"
              />
            </View>
          </AppCard>

          <Text
            onPress={() => router.back()}
            style={[styles.footerLink, { color: colors.accent }]}
          >
            {t("auth.verifyEmail.changeEmail")}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
    width: "100%",
    paddingVertical: 8,
  },
  emailText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
  },
  codeBox: {
    width: "15%",
    aspectRatio: 0.85,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "800",
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  footerLink: {
    fontWeight: "700",
    fontSize: 15,
  },
});

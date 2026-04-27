import * as AppleAuthentication from "expo-apple-authentication";
import { Link } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppleAuthButton } from "@/components/apple-auth-button";
import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { AppTextField } from "@/components/app-text-field";
import { ConfigNotice } from "@/components/config-notice";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { configurationError, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setFormError(null);
      setIsSubmitting(true);
      await signIn(email.trim(), password);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown sign-in error occurred.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to resume your exercises, progress, and daily routine.
            </Text>
          </View>

          <AppCard>
            <View style={styles.form}>
              <ConfigNotice message={configurationError} />
              <AppTextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="patient@example.com"
                value={email}
              />
              <AppTextField
                label="Password"
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
              />
              {formError !== null ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{formError}</Text>
              ) : null}
              <AppButton
                disabled={isSubmitting}
                label={isSubmitting ? "Signing in..." : "Sign in"}
                onPress={handleSubmit}
              />
              <AppleAuthButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                disabled={isSubmitting}
                onError={setFormError}
              />
            </View>
          </AppCard>

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            New to PyhsioTrack?{" "}
            <Link href="/(auth)/signup" style={[styles.footerLink, { color: colors.accent }]}>
              Create an account
            </Link>
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
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 20,
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  errorText: {
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

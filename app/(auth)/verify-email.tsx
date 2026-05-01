import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useAppTheme } from "@/providers/theme-provider";

export default function VerifyEmailScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    setIsSubmitting(true);
    // Simulate verification
    setTimeout(() => {
      setIsSubmitting(false);
      // @ts-ignore - Route types might not be updated yet in development
      router.replace("/(tabs)/dashboard");
    }, 1500);
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Email Doğrulama</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Lütfen e-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
            </Text>
          </View>

          <AppCard>
            <View style={styles.form}>
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

              <AppButton
                disabled={code.length < 6 || isSubmitting}
                label={isSubmitting ? "Doğrulanıyor..." : "Doğrula"}
                onPress={handleVerify}
              />

              <AppButton
                label="Kodu tekrar gönder"
                onPress={() => {}}
                variant="secondary"
              />
            </View>
          </AppCard>

          <Text
            onPress={() => router.back()}
            style={[styles.footerLink, { color: colors.accent }]}
          >
            E-posta adresini değiştir
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

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { useProgress } from "@/providers/progress-provider";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { formatDuration } from "@/theme/formatters";
import { getScreenMetrics } from "@/theme/layout";
import { type ThemePreference } from "@/types/domain";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const SettingsItem = ({ icon, label, onPress, color, value }: any) => (
  <Pressable onPress={onPress} style={styles.settingsItem}>
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CCC" />
  </Pressable>
);

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useAppTheme();
  const { width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const { completedSessions } = useProgress();

  // useSession hook'u /api/auth/me üzerinden gelen profil bilgilerini yönetir
  const { profile, signOut, refreshProfile } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const totalDurationSec = completedSessions.reduce((sum, item) => sum + item.completedDurationSec, 0);

  // Bu fonksiyon artık ismi manuel değiştirmez, 
  // backend'deki (onboarding ekranında girilen) ismi tazeler.
  const handleSyncName = async () => {
    try {
      await refreshProfile();
    } catch (error) {
      console.error("İsim senkronize edilemedi:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.purpleHeader, { backgroundColor: colors.accent }]}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { borderColor: colors.background }]}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>

          {/* Giriş ekranında (Onboarding) girilen isim burada gösterilir */}
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {profile?.fullName ?? "Yükleniyor..."}
          </Text>

          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {profile?.email}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <AppCard>
            <SettingsItem
              icon="person-outline"
              label="Edit Profile"
              color={colors.accent}
              onPress={handleSyncName}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="sync-outline"
              label="Refresh Profile"
              color="#4CAF50"
              onPress={refreshProfile}
            />
          </AppCard>

          <Text style={styles.sectionTitle}>PROGRESS</Text>
          <AppCard>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{completedSessions.length}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={[styles.separator, { height: '60%', width: 1 }]} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{formatDuration(totalDurationSec)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </View>
          </AppCard>

          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                style={[
                  styles.themeTab,
                  { backgroundColor: preference === option.value ? colors.accent : colors.surfaceMuted }
                ]}
              >
                <Text style={{ color: preference === option.value ? '#FFF' : colors.textPrimary, fontWeight: '600' }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <AppButton
            disabled={isSigningOut}
            label={isSigningOut ? "Signing out..." : "Sign out"}
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  purpleHeader: {
    height: 280,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 150 },
  profileCard: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEE',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userName: { fontSize: 22, fontWeight: '800' },
  userEmail: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginLeft: 5, marginBottom: -10 },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: { fontSize: 16, fontWeight: '600' },
  settingsValue: { fontSize: 12, color: '#999' },
  separator: { height: 1, backgroundColor: '#EEE' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 12, color: '#999' },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeTab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }
});
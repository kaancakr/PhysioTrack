import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { normalizeUtcDateTimes, parseAndNormalizeUtcJson } from "@/lib/datetime";
import { type AuthTokenPair } from "@/types/auth";
import {
  type Gender,
  type PersistedProgressState,
  type ThemePreference,
  type UserIntakeProfile,
} from "@/types/domain";

const THEME_PREFERENCE_KEY = "physiotrack:theme-preference";
const PROGRESS_STATE_KEY_PREFIX = "physiotrack:progress-state";
const USER_INTAKE_KEY_PREFIX = "physiotrack:user-intake";
const GUEST_INTAKE_KEY = "physiotrack:guest-intake";
const AUTH_TOKEN_PAIR_KEY = "physiotrack.auth-token-pair";
const PENDING_SIGNUP_EMAIL_KEY = "physiotrack:pending-signup-email";
const HAS_OPENED_APP_KEY = "physiotrack:has-opened-app";

function parseStoredJson(value: string, key: string): unknown {
  return parseAndNormalizeUtcJson(value, key);
}

function getProgressStorageKey(userId: string) {
  return `${PROGRESS_STATE_KEY_PREFIX}:${userId}`;
}

function getUserIntakeKey(userId: string) {
  return `${USER_INTAKE_KEY_PREFIX}:${userId}`;
}

function validateAuthTokenPair(value: unknown) {
  if (typeof value !== "object" || value === null) {
    throw new Error("Unexpected auth token pair structure in secure storage.");
  }

  const access = "access" in value ? value.access : null;
  const refresh = "refresh" in value ? value.refresh : null;

  if (typeof access !== "string" || access.length === 0) {
    throw new Error("Missing access token in secure storage.");
  }

  if (typeof refresh !== "string" || refresh.length === 0) {
    throw new Error("Missing refresh token in secure storage.");
  }

  return {
    access,
    refresh,
  } satisfies AuthTokenPair;
}

function normalizeStoredGender(value: unknown): Gender {
  if (
    value === "male" ||
    value === "female" ||
    value === "prefer_not_to_say"
  ) {
    return value;
  }

  return "prefer_not_to_say";
}

function normalizeStoredUserIntakeProfile(
  value: unknown,
  storageKey: string,
): UserIntakeProfile {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Unexpected intake profile state for key "${storageKey}".`);
  }

  const intakeProfile = value as Partial<UserIntakeProfile>;

  return {
    ageRange: intakeProfile.ageRange as UserIntakeProfile["ageRange"],
    dailyStepGoal:
      intakeProfile.dailyStepGoal as UserIntakeProfile["dailyStepGoal"],
    focusArea: intakeProfile.focusArea as UserIntakeProfile["focusArea"],
    fullName: intakeProfile.fullName as string,
    gender: normalizeStoredGender(intakeProfile.gender),
    weeklyGoal: intakeProfile.weeklyGoal as UserIntakeProfile["weeklyGoal"],
  };
}

export async function readThemePreference() {
  const storedValue = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, THEME_PREFERENCE_KEY);

  if (
    parsedValue === "system" ||
    parsedValue === "light" ||
    parsedValue === "dark"
  ) {
    return parsedValue;
  }

  throw new Error(
    `Unexpected theme preference value in storage: ${JSON.stringify(parsedValue)}`,
  );
}

export async function writeThemePreference(preference: ThemePreference) {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference));
}

export async function readPersistedProgressState(userId: string) {
  const key = getProgressStorageKey(userId);
  const storedValue = await AsyncStorage.getItem(key);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, key);

  if (typeof parsedValue !== "object" || parsedValue === null) {
    throw new Error(`Unexpected progress state for user "${userId}".`);
  }

  return parsedValue as PersistedProgressState;
}

export async function writePersistedProgressState(
  userId: string,
  progressState: PersistedProgressState,
) {
  const key = getProgressStorageKey(userId);
  await AsyncStorage.setItem(
    key,
    JSON.stringify(normalizeUtcDateTimes(progressState)),
  );
}

export async function clearPersistedProgressState(userId: string) {
  await AsyncStorage.removeItem(getProgressStorageKey(userId));
}

export async function readUserIntakeProfile(userId: string) {
  const key = getUserIntakeKey(userId);
  const storedValue = await AsyncStorage.getItem(key);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, key);
  return normalizeStoredUserIntakeProfile(parsedValue, key);
}

export async function writeUserIntakeProfile(
  userId: string,
  intakeProfile: UserIntakeProfile,
) {
  await AsyncStorage.setItem(
    getUserIntakeKey(userId),
    JSON.stringify(normalizeUtcDateTimes(intakeProfile)),
  );
}

export async function readGuestIntakeProfile() {
  const storedValue = await AsyncStorage.getItem(GUEST_INTAKE_KEY);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, GUEST_INTAKE_KEY);
  return normalizeStoredUserIntakeProfile(parsedValue, GUEST_INTAKE_KEY);
}

export async function writeGuestIntakeProfile(
  intakeProfile: UserIntakeProfile,
) {
  await AsyncStorage.setItem(
    GUEST_INTAKE_KEY,
    JSON.stringify(normalizeUtcDateTimes(intakeProfile)),
  );
}

export async function clearGuestIntakeProfile() {
  await AsyncStorage.removeItem(GUEST_INTAKE_KEY);
}

export async function readStoredAuthTokenPair() {
  const storedValue = await SecureStore.getItemAsync(AUTH_TOKEN_PAIR_KEY);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, AUTH_TOKEN_PAIR_KEY);
  return validateAuthTokenPair(parsedValue);
}

export async function writeStoredAuthTokenPair(tokenPair: AuthTokenPair) {
  await SecureStore.setItemAsync(
    AUTH_TOKEN_PAIR_KEY,
    JSON.stringify(normalizeUtcDateTimes(tokenPair)),
  );
}

export async function clearStoredAuthTokenPair() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_PAIR_KEY);
}

export async function readPendingSignupEmail() {
  const storedValue = await AsyncStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = parseStoredJson(storedValue, PENDING_SIGNUP_EMAIL_KEY);

  if (typeof parsedValue !== "string" || parsedValue.trim().length === 0) {
    throw new Error("Unexpected pending signup email value in storage.");
  }

  return parsedValue.trim();
}

export async function writePendingSignupEmail(email: string) {
  await AsyncStorage.setItem(
    PENDING_SIGNUP_EMAIL_KEY,
    JSON.stringify(normalizeUtcDateTimes(email)),
  );
}

export async function clearPendingSignupEmail() {
  await AsyncStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
}

export async function readHasOpenedApp() {
  const storedValue = await AsyncStorage.getItem(HAS_OPENED_APP_KEY);

  if (storedValue === null) {
    return false;
  }

  const parsedValue = parseStoredJson(storedValue, HAS_OPENED_APP_KEY);

  if (typeof parsedValue !== "boolean") {
    throw new Error("Unexpected app open flag value in storage.");
  }

  return parsedValue;
}

export async function writeHasOpenedApp() {
  await AsyncStorage.setItem(
    HAS_OPENED_APP_KEY,
    JSON.stringify(normalizeUtcDateTimes(true)),
  );
}

export async function clearAllStoredData() {
  const allKeys = await AsyncStorage.getAllKeys();
  const removableKeys = allKeys.filter((key) => key !== HAS_OPENED_APP_KEY);

  if (removableKeys.length > 0) {
    await AsyncStorage.multiRemove(removableKeys);
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_PAIR_KEY);
}

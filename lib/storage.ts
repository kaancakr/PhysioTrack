import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  type PersistedProgressState,
  type ThemePreference,
  type UserIntakeProfile,
} from "@/types/domain";

const THEME_PREFERENCE_KEY = "pyhsiotrack:theme-preference";
const PROGRESS_STATE_KEY_PREFIX = "pyhsiotrack:progress-state";
const USER_INTAKE_KEY_PREFIX = "pyhsiotrack:user-intake";

function parseStoredJson(value: string, key: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(
      `Failed to parse storage value for key "${key}": ${
        error instanceof Error ? error.message : "Unknown parsing error."
      }`,
    );
  }
}

function getProgressStorageKey(userId: string) {
  return `${PROGRESS_STATE_KEY_PREFIX}:${userId}`;
}

function getUserIntakeKey(userId: string) {
  return `${USER_INTAKE_KEY_PREFIX}:${userId}`;
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
  await AsyncStorage.setItem(key, JSON.stringify(progressState));
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

  if (typeof parsedValue !== "object" || parsedValue === null) {
    throw new Error(`Unexpected user intake state for user "${userId}".`);
  }

  return parsedValue as UserIntakeProfile;
}

export async function writeUserIntakeProfile(
  userId: string,
  intakeProfile: UserIntakeProfile,
) {
  await AsyncStorage.setItem(getUserIntakeKey(userId), JSON.stringify(intakeProfile));
}

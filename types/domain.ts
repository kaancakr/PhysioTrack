import { Ionicons } from "@expo/vector-icons";

export type ThemePreference = "system" | "light" | "dark";
export type ThemeMode = "light" | "dark";
export type FocusArea = "neck" | "shoulder" | "back" | "knee" | "mobility";
export type ExerciseIconName = keyof typeof Ionicons.glyphMap;

export type ThemeColors = {
  accent: string;
  accentContrast: string;
  accentSoft: string;
  background: string;
  border: string;
  card: string;
  danger: string;
  success: string;
  surfaceMuted: string;
  textMuted: string;
  textPrimary: string;
  textSecondary: string;
};

export type ExerciseIllustration = {
  background: string;
  icon: ExerciseIconName;
  tint: string;
};

export type UserProfile = {
  email: string;
  fullName: string | null;
  id: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isStaff: boolean;
};

export type WeeklyGoal = 2 | 3 | 4 | 5;
export type Gender = "male" | "female" | "prefer_not_to_say";

export type UserIntakeProfile = {
  ageRange: "18-29" | "30-44" | "45-59" | "60+";
  dailyStepGoal: 3000 | 5000 | 7000 | 9000;
  focusArea: FocusArea;
  fullName: string;
  gender: Gender;
  weeklyGoal: WeeklyGoal;
};

export type ExerciseStep = {
  bodyArea: FocusArea;
  cautionNote: string;
  durationSec: number;
  id: string;
  image: ExerciseIllustration;
  instruction: string;
  title: string;
};

export type ExerciseProgram = {
  coverImage: ExerciseIllustration;
  description: string;
  difficultyLabel: string;
  focusArea: FocusArea;
  focusAreaLabel: string;
  id: string;
  steps: ExerciseStep[];
  title: string;
  totalDurationSec: number;
};

export type SessionProgress = {
  completedAt: string | null;
  currentStepIndex: number;
  elapsedStepSec: number;
  isPaused: boolean;
  programId: string;
  startedAt: string;
  updatedAt: string;
};

export type CompletedSessionRecord = {
  completedAt: string;
  completedDurationSec: number;
  programId: string;
  startedAt: string;
};

export type PersistedProgressState = {
  activeSession: SessionProgress | null;
  completedSessions: CompletedSessionRecord[];
};

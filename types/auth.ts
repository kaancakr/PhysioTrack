import { type FocusArea, type UserIntakeProfile, type WeeklyGoal } from "@/types/domain";

export type AuthTokenPair = {
  access: string;
  refresh: string;
};

export type BackendUserProfile = {
  age_range: UserIntakeProfile["ageRange"];
  daily_step_goal: UserIntakeProfile["dailyStepGoal"];
  focus_area: FocusArea;
  full_name: string;
  metadata: Record<string, unknown> | null;
  weekly_goal: WeeklyGoal;
};

export type BackendUser = {
  email: string;
  id: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_staff: boolean;
  profile: BackendUserProfile | null;
};

export type SignupRequestPayload = {
  age_range: UserIntakeProfile["ageRange"];
  daily_step_goal: UserIntakeProfile["dailyStepGoal"];
  email: string;
  focus_area: FocusArea;
  full_name: string;
  password: string;
  weekly_goal: WeeklyGoal;
};

export type SignupResponsePayload = {
  message: string;
  verification_required: boolean;
};

export type LoginRequestPayload = {
  email: string;
  password: string;
};

export type VerifySignupCodeRequestPayload = {
  code: string;
  email: string;
};

export type SendSignupCodeRequestPayload = {
  email: string;
};

export type LogoutRequestPayload = {
  refresh: string;
};

export type MessageResponsePayload = {
  message: string;
};

export type TokenPairResponsePayload = AuthTokenPair & {
  user: BackendUser;
};

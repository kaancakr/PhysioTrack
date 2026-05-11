import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AuthRequestError,
  clearAuthTokenPair,
  isUnauthenticatedRequestError,
  registerAuthTokenRefreshHandler,
  registerUnauthorizedHandler,
  requestAuthJson,
  setAuthTokenPair,
  unregisterAuthTokenRefreshHandler,
  unregisterUnauthorizedHandler,
} from "@/lib/auth";
import { getBackendConfigurationError } from "@/lib/backend";
import {
  clearAllStoredData,
  clearGuestIntakeProfile,
  clearPendingSignupEmail,
  clearStoredAuthTokenPair,
  readGuestIntakeProfile,
  readHasOpenedApp,
  readPendingSignupEmail,
  readStoredAuthTokenPair,
  readUserIntakeProfile,
  writeGuestIntakeProfile,
  writeHasOpenedApp,
  writePendingSignupEmail,
  writeStoredAuthTokenPair,
  writeUserIntakeProfile,
} from "@/lib/storage";
import {
  type AuthTokenPair,
  type BackendOverallProgress,
  type BackendUser,
  type LoginRequestPayload,
  type LogoutRequestPayload,
  type MessageResponsePayload,
  type SendSignupCodeRequestPayload,
  type SignupRequestPayload,
  type SignupResponsePayload,
  type TokenPairResponsePayload,
  type UpdateProfileRequestPayload,
  type VerifySignupCodeRequestPayload,
} from "@/types/auth";
import {
  type UserIntakeProfile,
  type UserOverallProgress,
  type UserProfile,
} from "@/types/domain";

const AUTH_BYPASS_ENABLED = false;
const BYPASS_PROFILE: UserProfile = {
  email: "demo@physiotrack.local",
  fullName: "Demo Patient",
  id: "demo-user",
  isActive: true,
  isEmailVerified: true,
  isStaff: false,
  overallProgress: {
    completedExercisesCount: 0,
    completedProgramsCount: 0,
    completedStepsCount: 0,
    exercisesCount: 0,
    isFinished: false,
    programsCount: 0,
    stepsCount: 0,
  },
};

type AppSession = {
  user: BackendUser;
};

type SessionContextValue = {
  configurationError: string | null;
  currentUserId: string | null;
  hasCompletedGuestOnboarding: boolean;
  intakeProfile: UserIntakeProfile | null;
  isAppleAuthAvailable: boolean;
  isFirstAppLaunch: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  isReturningUserWelcomeRedirectEnabled: boolean;
  isTestingBypassEnabled: boolean;
  pendingSignupEmail: string | null;
  profile: UserProfile | null;
  saveIntakeProfile: (intakeProfile: UserIntakeProfile) => Promise<void>;
  session: AppSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resendSignupCode: () => Promise<void>;
  verifySignupCode: (code: string) => Promise<void>;
  updateProfile: (payload: UpdateProfileRequestPayload) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function isAuthBypassEnabled() {
  const rawValue = process.env.EXPO_PUBLIC_AUTH_BYPASS;

  if (typeof rawValue !== "string") {
    return AUTH_BYPASS_ENABLED;
  }

  return rawValue === "true";
}

function readReturningUserWelcomeRedirectEnabled() {
  const rawValue = process.env.EXPO_PUBLIC_RETURNING_USER_WELCOME_REDIRECT;

  if (typeof rawValue !== "string") {
    return false;
  }

  return rawValue === "true";
}

function buildMissingConfigurationError(action: string) {
  return `${action} is unavailable. ${getBackendConfigurationError()}`;
}

function mapBackendOverallProgressToOverallProgress(
  backendProgress: BackendOverallProgress | null,
) {
  return {
    completedExercisesCount: backendProgress?.completed_exercises_count ?? 0,
    completedProgramsCount: backendProgress?.completed_programs_count ?? 0,
    completedStepsCount: backendProgress?.completed_steps_count ?? 0,
    exercisesCount: backendProgress?.exercises_count ?? 0,
    isFinished: backendProgress?.is_finished ?? false,
    programsCount: backendProgress?.programs_count ?? 0,
    stepsCount: backendProgress?.steps_count ?? 0,
  } satisfies UserOverallProgress;
}

function mapBackendUserToProfile(user: BackendUser) {
  return {
    email: user.email,
    fullName: user.profile?.full_name ?? null,
    id: user.id,
    isActive: user.is_active,
    isEmailVerified: user.is_email_verified,
    isStaff: user.is_staff,
    overallProgress: mapBackendOverallProgressToOverallProgress(
      user.overall_progress,
    ),
  } satisfies UserProfile;
}

function mapBackendUserToIntakeProfile(user: BackendUser) {
  if (user.profile === null) {
    return null;
  }

  return {
    ageRange: user.profile.age_range,
    dailyStepGoal: user.profile.daily_step_goal,
    focusArea: user.profile.focus_area,
    fullName: user.profile.full_name,
    gender: user.profile.gender,
    weeklyGoal: user.profile.weekly_goal,
  } satisfies UserIntakeProfile;
}

function buildSignupRequestPayload(params: {
  email: string;
  fullName: string;
  intakeProfile: UserIntakeProfile;
  password: string;
}) {
  return {
    age_range: params.intakeProfile.ageRange,
    daily_step_goal: params.intakeProfile.dailyStepGoal,
    email: params.email,
    focus_area: params.intakeProfile.focusArea,
    full_name: params.fullName,
    gender: params.intakeProfile.gender,
    password: params.password,
    weekly_goal: params.intakeProfile.weeklyGoal,
  } satisfies SignupRequestPayload;
}

export function SessionProvider(props: PropsWithChildren) {
  const isTestingBypassEnabled = isAuthBypassEnabled();
  const isReturningUserWelcomeRedirectEnabled =
    readReturningUserWelcomeRedirectEnabled();
  const configurationError = getBackendConfigurationError();
  const [hasCompletedGuestOnboarding, setHasCompletedGuestOnboarding] =
    useState(false);
  const [intakeProfile, setIntakeProfile] = useState<UserIntakeProfile | null>(
    null,
  );
  const [isFirstAppLaunch, setIsFirstAppLaunch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(
    null,
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);

  const applySignedOutState = useCallback(async () => {
    const guestProfile = await readGuestIntakeProfile();
    const storedPendingSignupEmail = await readPendingSignupEmail();
    clearAuthTokenPair();
    setHasCompletedGuestOnboarding(guestProfile !== null);
    setIntakeProfile(guestProfile);
    setPendingSignupEmail(storedPendingSignupEmail);
    setProfile(null);
    setSession(null);
  }, []);

  const applyAuthenticatedState = useCallback(
    async (tokenPair: AuthTokenPair, user: BackendUser) => {
      setAuthTokenPair(tokenPair);
      const guestProfile = await readGuestIntakeProfile();
      const backendIntakeProfile = mapBackendUserToIntakeProfile(user);
      const storedIntakeProfile = await readUserIntakeProfile(user.id);
      const resolvedIntakeProfile =
        backendIntakeProfile ?? storedIntakeProfile ?? guestProfile;

      if (resolvedIntakeProfile !== null) {
        await writeUserIntakeProfile(user.id, resolvedIntakeProfile);
      }

      if (guestProfile !== null) {
        await clearGuestIntakeProfile();
      }

      setHasCompletedGuestOnboarding(false);
      setIntakeProfile(resolvedIntakeProfile);
      setPendingSignupEmail(null);
      setProfile(mapBackendUserToProfile(user));
      setSession({
        user,
      });
    },
    [],
  );

  const restoreAuthenticatedState = useCallback(
    async (tokenPair: AuthTokenPair) => {
      setAuthTokenPair(tokenPair);
      const user = await requestAuthJson<BackendUser>("/api/auth/me", {
        method: "GET",
      });
      const resolvedTokenPair = (await readStoredAuthTokenPair()) ?? tokenPair;

      await applyAuthenticatedState(resolvedTokenPair, user);
    },
    [applyAuthenticatedState],
  );

  useEffect(() => {
    let isActive = true;

    const initializeSession = async () => {
      const hasOpenedApp = await readHasOpenedApp();

      if (isActive) {
        setIsFirstAppLaunch(!hasOpenedApp);
      }

      await writeHasOpenedApp();

      if (isTestingBypassEnabled) {
        clearAuthTokenPair();
        const guestProfile = await readGuestIntakeProfile();
        const storedIntakeProfile = await readUserIntakeProfile(
          BYPASS_PROFILE.id,
        );
        const storedPendingSignupEmail = await readPendingSignupEmail();

        if (!isActive) {
          return;
        }

        setHasCompletedGuestOnboarding(guestProfile !== null);
        setIntakeProfile(storedIntakeProfile ?? guestProfile);
        setPendingSignupEmail(storedPendingSignupEmail);
        setProfile(BYPASS_PROFILE);
        setSession(null);
        setIsLoading(false);
        return;
      }

      const guestProfile = await readGuestIntakeProfile();
      const storedPendingSignupEmail = await readPendingSignupEmail();

      if (isActive) {
        setHasCompletedGuestOnboarding(guestProfile !== null);
        setPendingSignupEmail(storedPendingSignupEmail);
      }

      if (configurationError !== null) {
        if (isActive) {
          setIsLoading(false);
        }
        return;
      }

      const storedTokenPair = await readStoredAuthTokenPair();

      if (storedTokenPair === null) {
        if (isActive) {
          setProfile(null);
          setSession(null);
          setIntakeProfile(guestProfile);
          setIsLoading(false);
        }
        return;
      }

      try {
        await restoreAuthenticatedState(storedTokenPair);
      } catch (error) {
        if (isUnauthenticatedRequestError(error)) {
          await clearStoredAuthTokenPair();
          await applySignedOutState();
        } else {
          const storedTokenPair = await readStoredAuthTokenPair();
          if (storedTokenPair) {
            // Offline profile yüklemesi yapabilirsin veya session'ı mevcut haliyle bırakabilirsin
            console.warn(
              "Could not reach server to verify session. Assuming offline mode.",
              error,
            );
          }
        }
        if (error instanceof AuthRequestError) {
          console.warn("Stored session restore failed", {
            path: error.path,
            responseBody: error.responseBody,
            status: error.status,
          });
        } else {
          console.warn("Stored session restore failed", {
            error,
          });
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void initializeSession();

    return () => {
      isActive = false;
    };
  }, [
    applySignedOutState,
    configurationError,
    isTestingBypassEnabled,
    restoreAuthenticatedState,
  ]);

  const saveIntakeProfile = useCallback(
    async (nextIntakeProfile: UserIntakeProfile) => {
      const userId = profile?.id ?? null;

      if (userId === null) {
        await writeGuestIntakeProfile(nextIntakeProfile);
        setHasCompletedGuestOnboarding(true);
        setIntakeProfile(nextIntakeProfile);
        return;
      }

      await writeUserIntakeProfile(userId, nextIntakeProfile);
      setIntakeProfile(nextIntakeProfile);
    },
    [profile?.id],
  );

  const refreshAccessToken = useCallback(
    async (expiredAccessToken: string | null) => {
      if (expiredAccessToken === null) {
        return null;
      }

      const storedTokenPair = await readStoredAuthTokenPair();

      if (storedTokenPair === null) {
        return null;
      }

      if (storedTokenPair.access !== expiredAccessToken) {
        return storedTokenPair;
      }

      const refreshedTokenPair = await requestAuthJson<AuthTokenPair>(
        "/api/auth/token/refresh",
        {
          authenticate: false,
          handleUnauthorized: true,
          body: JSON.stringify({
            refresh: storedTokenPair.refresh,
          } satisfies LogoutRequestPayload),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      await writeStoredAuthTokenPair(refreshedTokenPair);
      setAuthTokenPair(refreshedTokenPair);
      return refreshedTokenPair;
    },
    [],
  );

  const handleUnauthorized = useCallback(async () => {
    await clearStoredAuthTokenPair();
    await applySignedOutState();
  }, [applySignedOutState]);

  useEffect(() => {
    registerAuthTokenRefreshHandler(refreshAccessToken);
    registerUnauthorizedHandler(handleUnauthorized);

    return () => {
      unregisterAuthTokenRefreshHandler(refreshAccessToken);
      unregisterUnauthorizedHandler(handleUnauthorized);
    };
  }, [handleUnauthorized, refreshAccessToken]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (isTestingBypassEnabled) {
        return;
      }

      if (configurationError !== null) {
        throw new Error(buildMissingConfigurationError("Sign in"));
      }

      const response = await requestAuthJson<TokenPairResponsePayload>(
        "/api/auth/login",
        {
          authenticate: false,
          body: JSON.stringify({
            email,
            password,
          } satisfies LoginRequestPayload),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      const tokenPair = {
        access: response.access,
        refresh: response.refresh,
      } satisfies AuthTokenPair;

      await writeStoredAuthTokenPair(tokenPair);
      await clearPendingSignupEmail();
      await applyAuthenticatedState(tokenPair, response.user);
    },
    [applyAuthenticatedState, configurationError, isTestingBypassEnabled],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (isTestingBypassEnabled) {
        return;
      }

      if (configurationError !== null) {
        throw new Error(buildMissingConfigurationError("Sign up"));
      }

      const guestIntakeProfile = await readGuestIntakeProfile();

      if (guestIntakeProfile === null) {
        throw new Error(
          "Complete onboarding before creating an account so we can include your intake profile.",
        );
      }

      const fullName = guestIntakeProfile.fullName.trim();

      if (fullName.length === 0) {
        throw new Error(
          "Complete onboarding before creating an account so we can include your full name.",
        );
      }

      await requestAuthJson<SignupResponsePayload>("/api/auth/signup", {
        authenticate: false,
        body: JSON.stringify(
          buildSignupRequestPayload({
            email,
            fullName,
            intakeProfile: guestIntakeProfile,
            password,
          }),
        ),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      await writePendingSignupEmail(email);
      setPendingSignupEmail(email);
    },
    [configurationError, isTestingBypassEnabled],
  );

  const refreshProfile = useCallback(async () => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Refresh profile"));
    }

    const user = await requestAuthJson<BackendUser>("/api/auth/me", {
      method: "GET",
    });

    const backendIntakeProfile = mapBackendUserToIntakeProfile(user);
    if (backendIntakeProfile !== null) {
      await writeUserIntakeProfile(user.id, backendIntakeProfile);
      setIntakeProfile(backendIntakeProfile);
    }
    setProfile(mapBackendUserToProfile(user));
    setSession({ user });
  }, [configurationError, isTestingBypassEnabled]);

  const updateProfile = useCallback(async (payload: UpdateProfileRequestPayload) => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Update profile"));
    }

    // Call the proxy route we just created
    const user = await requestAuthJson<BackendUser>("/api/auth/profile/edit", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });

    const backendIntakeProfile = mapBackendUserToIntakeProfile(user);
    if (backendIntakeProfile !== null) {
      await writeUserIntakeProfile(user.id, backendIntakeProfile);
      setIntakeProfile(backendIntakeProfile);
    }
    setProfile(mapBackendUserToProfile(user));
    setSession({ user });
  }, [configurationError, isTestingBypassEnabled]);

  const verifySignupCode = useCallback(
    async (code: string) => {
      if (isTestingBypassEnabled) {
        return;
      }

      if (configurationError !== null) {
        throw new Error(buildMissingConfigurationError("Email verification"));
      }

      const email = pendingSignupEmail ?? (await readPendingSignupEmail());

      if (email === null) {
        throw new Error("No pending signup email exists for verification.");
      }

      const response = await requestAuthJson<TokenPairResponsePayload>(
        "/api/auth/verify-signup-code",
        {
          authenticate: false,
          body: JSON.stringify({
            code,
            email,
          } satisfies VerifySignupCodeRequestPayload),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      const tokenPair = {
        access: response.access,
        refresh: response.refresh,
      } satisfies AuthTokenPair;

      await writeStoredAuthTokenPair(tokenPair);
      await clearPendingSignupEmail();
      await applyAuthenticatedState(tokenPair, response.user);
    },
    [
      applyAuthenticatedState,
      configurationError,
      isTestingBypassEnabled,
      pendingSignupEmail,
    ],
  );

  const resendSignupCode = useCallback(async () => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(
        buildMissingConfigurationError("Resend verification code"),
      );
    }

    const email = pendingSignupEmail ?? (await readPendingSignupEmail());

    if (email === null) {
      throw new Error(
        "No pending signup email exists for resending a verification code.",
      );
    }

    await requestAuthJson<MessageResponsePayload>(
      "/api/auth/send-signup-code",
      {
        authenticate: false,
        body: JSON.stringify({
          email,
        } satisfies SendSignupCodeRequestPayload),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      },
    );
  }, [configurationError, isTestingBypassEnabled, pendingSignupEmail]);

  const signOut = useCallback(async () => {
    if (isTestingBypassEnabled) {
      clearAuthTokenPair();
      setHasCompletedGuestOnboarding(false);
      setIntakeProfile(null);
      setPendingSignupEmail(null);
      setProfile(null);
      setSession(null);
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Sign out"));
    }

    const storedTokenPair = await readStoredAuthTokenPair();

    if (storedTokenPair === null) {
      await clearAllStoredData();
      clearAuthTokenPair();
      setHasCompletedGuestOnboarding(false);
      setIntakeProfile(null);
      setPendingSignupEmail(null);
      setProfile(null);
      setSession(null);
      return;
    }

    try {
      await requestAuthJson<MessageResponsePayload>("/api/auth/logout", {
        body: JSON.stringify({
          refresh: storedTokenPair.refresh,
        } satisfies LogoutRequestPayload),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
    } catch (error) {
      if (!isUnauthenticatedRequestError(error)) {
        throw error;
      }
    }
    await clearAllStoredData();
    clearAuthTokenPair();
    setHasCompletedGuestOnboarding(false);
    setIntakeProfile(null);
    setPendingSignupEmail(null);
    setProfile(null);
    setSession(null);
  }, [configurationError, isTestingBypassEnabled]);

  const signInWithApple = useCallback(async () => {
    throw new Error(
      "Apple Sign-In is unavailable until it is wired to your backend API routes.",
    );
  }, []);

  return (
    <SessionContext.Provider
      value={{
        configurationError,
        currentUserId: profile?.id ?? null,
        hasCompletedGuestOnboarding,
        intakeProfile,
        isAppleAuthAvailable: false,
        isFirstAppLaunch,
        isLoading,
        isOnboardingComplete: intakeProfile !== null,
        isReturningUserWelcomeRedirectEnabled,
        isTestingBypassEnabled,
        pendingSignupEmail,
        profile,
        saveIntakeProfile,
        session,
        signIn,
        signInWithApple,
        signOut,
        signUp,
        resendSignupCode,
        verifySignupCode,
        updateProfile,
        refreshProfile,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}

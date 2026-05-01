import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { getBackendConfigurationError } from "@/lib/backend";
import {
    clearAllStoredData,
    clearGuestIntakeProfile,
    clearPendingSignupEmail,
    clearStoredAuthTokenPair,
    readGuestIntakeProfile,
    readPendingSignupEmail,
    readStoredAuthTokenPair,
    readUserIntakeProfile,
    writeGuestIntakeProfile,
    writePendingSignupEmail,
    writeStoredAuthTokenPair,
    writeUserIntakeProfile,
} from "@/lib/storage";
import {
    type AuthTokenPair,
    type BackendUser,
    type LoginRequestPayload,
    type LogoutRequestPayload,
    type MessageResponsePayload,
    type SendSignupCodeRequestPayload,
    type SignupRequestPayload,
    type SignupResponsePayload,
    type TokenPairResponsePayload,
    type VerifySignupCodeRequestPayload,
} from "@/types/auth";
import { type UserIntakeProfile, type UserProfile } from "@/types/domain";

const AUTH_BYPASS_ENABLED = false;
const BYPASS_PROFILE: UserProfile = {
  email: "demo@physiotrack.local",
  fullName: "Demo Patient",
  id: "demo-user",
  isActive: true,
  isEmailVerified: true,
  isStaff: false,
};

type AppSession = {
  tokenPair: AuthTokenPair;
  user: BackendUser;
};

type ApiRouteRequestMethod = "GET" | "POST";

type ApiRouteRequestParams = {
  accessToken: string | null;
  body: unknown | null;
  method: ApiRouteRequestMethod;
  path: string;
};

type SessionContextValue = {
  configurationError: string | null;
  currentUserId: string | null;
  hasCompletedGuestOnboarding: boolean;
  intakeProfile: UserIntakeProfile | null;
  isAppleAuthAvailable: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
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
};

class ApiRouteRequestError extends Error {
  path: string;
  responseBody: string | null;
  status: number | null;

  constructor(
    message: string,
    status: number | null,
    path: string,
    responseBody: string | null,
  ) {
    super(message);
    this.name = "ApiRouteRequestError";
    this.status = status;
    this.path = path;
    this.responseBody = responseBody;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

function isAuthBypassEnabled() {
  const rawValue = process.env.EXPO_PUBLIC_AUTH_BYPASS;

  if (typeof rawValue !== "string") {
    return AUTH_BYPASS_ENABLED;
  }

  return rawValue === "true";
}

function buildMissingConfigurationError(action: string) {
  return `${action} is unavailable. ${getBackendConfigurationError()}`;
}

function buildApiRouteHeaders(accessToken: string | null, hasBody: boolean) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (hasBody) {
    headers.set("content-type", "application/json");
  }

  if (accessToken !== null) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

function parseJsonResponse<TResponse>(
  responseText: string,
  path: string,
  status: number,
) {
  try {
    return JSON.parse(responseText) as TResponse;
  } catch (error) {
    throw new ApiRouteRequestError(
      `API route response for "${path}" was not valid JSON: ${
        error instanceof Error ? error.message : "Unknown parsing error."
      }`,
      status,
      path,
      responseText,
    );
  }
}

async function performApiRouteRequest<TResponse>(
  params: ApiRouteRequestParams,
) {
  const hasBody = params.body !== null;
  const response = await fetch(params.path, {
    body: hasBody ? JSON.stringify(params.body) : undefined,
    headers: buildApiRouteHeaders(params.accessToken, hasBody),
    method: params.method,
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new ApiRouteRequestError(
      `API route request failed for "${params.path}" with status ${response.status}.`,
      response.status,
      params.path,
      responseText,
    );
  }

  return parseJsonResponse<TResponse>(
    responseText,
    params.path,
    response.status,
  );
}

function isUnauthorizedApiRouteError(error: unknown) {
  return error instanceof ApiRouteRequestError && error.status === 401;
}

function mapBackendUserToProfile(user: BackendUser) {
  return {
    email: user.email,
    fullName: user.profile?.full_name ?? null,
    id: user.id,
    isActive: user.is_active,
    isEmailVerified: user.is_email_verified,
    isStaff: user.is_staff,
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
    password: params.password,
    weekly_goal: params.intakeProfile.weeklyGoal,
  } satisfies SignupRequestPayload;
}

async function loginWithApiRoute(payload: LoginRequestPayload) {
  return performApiRouteRequest<TokenPairResponsePayload>({
    accessToken: null,
    body: payload,
    method: "POST",
    path: "/api/auth/login",
  });
}

async function signupWithApiRoute(payload: SignupRequestPayload) {
  return performApiRouteRequest<SignupResponsePayload>({
    accessToken: null,
    body: payload,
    method: "POST",
    path: "/api/auth/signup",
  });
}

async function verifySignupCodeWithApiRoute(
  payload: VerifySignupCodeRequestPayload,
) {
  return performApiRouteRequest<TokenPairResponsePayload>({
    accessToken: null,
    body: payload,
    method: "POST",
    path: "/api/auth/verify-signup-code",
  });
}

async function resendSignupCodeWithApiRoute(
  payload: SendSignupCodeRequestPayload,
) {
  return performApiRouteRequest<MessageResponsePayload>({
    accessToken: null,
    body: payload,
    method: "POST",
    path: "/api/auth/send-signup-code",
  });
}

async function refreshTokenPairWithApiRoute(tokenPair: AuthTokenPair) {
  return performApiRouteRequest<AuthTokenPair>({
    accessToken: null,
    body: {
      refresh: tokenPair.refresh,
    },
    method: "POST",
    path: "/api/auth/token/refresh",
  });
}

async function logoutWithApiRoute(params: {
  accessToken: string;
  payload: LogoutRequestPayload;
}) {
  return performApiRouteRequest<MessageResponsePayload>({
    accessToken: params.accessToken,
    body: params.payload,
    method: "POST",
    path: "/api/auth/logout",
  });
}

async function fetchCurrentUserWithApiRoute(accessToken: string) {
  return performApiRouteRequest<BackendUser>({
    accessToken,
    body: null,
    method: "GET",
    path: "/api/auth/me",
  });
}

export function SessionProvider(props: PropsWithChildren) {
  const isTestingBypassEnabled = isAuthBypassEnabled();
  const configurationError = getBackendConfigurationError();
  const [hasCompletedGuestOnboarding, setHasCompletedGuestOnboarding] =
    useState(false);
  const [intakeProfile, setIntakeProfile] = useState<UserIntakeProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(
    null,
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);

  const applySignedOutState = useCallback(async () => {
    const guestProfile = await readGuestIntakeProfile();
    const storedPendingSignupEmail = await readPendingSignupEmail();
    setHasCompletedGuestOnboarding(guestProfile !== null);
    setIntakeProfile(guestProfile);
    setPendingSignupEmail(storedPendingSignupEmail);
    setProfile(null);
    setSession(null);
  }, []);

  const applyAuthenticatedState = useCallback(
    async (tokenPair: AuthTokenPair, user: BackendUser) => {
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
        tokenPair,
        user,
      });
    },
    [],
  );

  const restoreAuthenticatedState = useCallback(
    async (tokenPair: AuthTokenPair) => {
      try {
        const user = await fetchCurrentUserWithApiRoute(tokenPair.access);
        await applyAuthenticatedState(tokenPair, user);
        return;
      } catch (error) {
        if (!isUnauthorizedApiRouteError(error)) {
          throw error;
        }
      }

      const refreshedTokenPair = await refreshTokenPairWithApiRoute(tokenPair);
      await writeStoredAuthTokenPair(refreshedTokenPair);
      const user = await fetchCurrentUserWithApiRoute(
        refreshedTokenPair.access,
      );
      await applyAuthenticatedState(refreshedTokenPair, user);
    },
    [applyAuthenticatedState],
  );

  useEffect(() => {
    let isActive = true;

    const initializeSession = async () => {
      if (isTestingBypassEnabled) {
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
        await clearStoredAuthTokenPair();
        await applySignedOutState();

        if (error instanceof ApiRouteRequestError) {
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

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (isTestingBypassEnabled) {
        return;
      }

      if (configurationError !== null) {
        throw new Error(buildMissingConfigurationError("Sign in"));
      }

      const response = await loginWithApiRoute({
        email,
        password,
      });
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

      await signupWithApiRoute(
        buildSignupRequestPayload({
          email,
          fullName,
          intakeProfile: guestIntakeProfile,
          password,
        }),
      );
      await writePendingSignupEmail(email);
      setPendingSignupEmail(email);
    },
    [configurationError, isTestingBypassEnabled],
  );

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

      const response = await verifySignupCodeWithApiRoute({
        code,
        email,
      });
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

    await resendSignupCodeWithApiRoute({
      email,
    });
  }, [configurationError, isTestingBypassEnabled, pendingSignupEmail]);

  const signOut = useCallback(async () => {
    if (isTestingBypassEnabled) {
      setHasCompletedGuestOnboarding(true);
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
      setHasCompletedGuestOnboarding(true);
      setIntakeProfile(null);
      setPendingSignupEmail(null);
      setProfile(null);
      setSession(null);
      return;
    }

    await logoutWithApiRoute({
      accessToken: storedTokenPair.access,
      payload: {
        refresh: storedTokenPair.refresh,
      },
    });
    await clearAllStoredData();
    setHasCompletedGuestOnboarding(true);
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
        isLoading,
        isOnboardingComplete: intakeProfile !== null,
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

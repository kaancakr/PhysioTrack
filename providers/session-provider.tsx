import * as AppleAuthentication from "expo-apple-authentication";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Session } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { readUserIntakeProfile, writeUserIntakeProfile } from "@/lib/storage";
import {
  getBypassProfile,
  getSupabaseClient,
  getSupabaseConfigurationError,
  isAuthBypassEnabled,
  mapUserToProfile,
} from "@/lib/supabase";
import { type UserIntakeProfile, type UserProfile } from "@/types/domain";

type SessionContextValue = {
  isAppleAuthAvailable: boolean;
  currentUserId: string | null;
  configurationError: string | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  isTestingBypassEnabled: boolean;
  intakeProfile: UserIntakeProfile | null;
  profile: UserProfile | null;
  saveIntakeProfile: (intakeProfile: UserIntakeProfile) => Promise<void>;
  session: Session | null;
  signInWithApple: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function buildMissingConfigurationError(action: string) {
  return `${action} is unavailable. ${getSupabaseConfigurationError()}`;
}

function buildAppleFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null) {
  if (fullName === null) {
    return null;
  }

  const formattedName = [
    fullName.givenName,
    fullName.middleName,
    fullName.familyName,
  ]
    .filter((namePart): namePart is string => {
      return typeof namePart === "string" && namePart.trim().length > 0;
    })
    .join(" ")
    .trim();

  if (formattedName.length === 0) {
    return null;
  }

  return formattedName;
}

function createAppleNonce() {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error(
      "Apple Sign-In requires secure nonce generation, but crypto.randomUUID is unavailable on this device.",
    );
  }

  return globalThis.crypto.randomUUID();
}

export function SessionProvider(props: PropsWithChildren) {
  const isTestingBypassEnabled = isAuthBypassEnabled();
  const configurationError = getSupabaseConfigurationError();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [intakeProfile, setIntakeProfile] = useState<UserIntakeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  const applySessionState = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);
      setProfile(mapUserToProfile(nextSession?.user ?? null));

      if (nextSession?.user.id !== undefined) {
        const storedIntakeProfile = await readUserIntakeProfile(nextSession.user.id);
        setIntakeProfile(storedIntakeProfile);
        return;
      }

      setIntakeProfile(null);
    },
    [],
  );

  useEffect(() => {
    if (isTestingBypassEnabled) {
      const bypassProfile = getBypassProfile();
      setSession(null);
      setProfile(bypassProfile);
      void readUserIntakeProfile(bypassProfile.id)
        .then((storedIntakeProfile) => {
          setIntakeProfile(storedIntakeProfile);
        })
        .finally(() => {
          setIsAppleAuthAvailable(false);
          setIsLoading(false);
        });
      return;
    }

    let isActive = true;

    const loadAppleAvailability = async () => {
      if (Platform.OS !== "ios") {
        if (isActive) {
          setIsAppleAuthAvailable(false);
        }
        return;
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (isActive) {
        setIsAppleAuthAvailable(isAvailable);
      }
    };

    void loadAppleAvailability();

    if (configurationError !== null) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const client = getSupabaseClient();

    const initializeSession = async () => {
      const { data, error } = await client.auth.getSession();

      if (error !== null) {
        throw new Error(`Supabase session restore failed: ${error.message}`);
      }

      await applySessionState(data.session);

      if (isActive) {
        setIsLoading(false);
      }
    };

    void initializeSession();

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      void applySessionState(nextSession).finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });
    });

    const revokeSubscription =
      Platform.OS === "ios"
        ? AppleAuthentication.addRevokeListener(() => {
            void client.auth.signOut();
          })
        : null;

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
      revokeSubscription?.remove();
    };
  }, [applySessionState, configurationError, isTestingBypassEnabled]);

  const saveIntakeProfile = async (nextIntakeProfile: UserIntakeProfile) => {
    const userId = profile?.id;

    if (userId === undefined) {
      throw new Error("Cannot save onboarding profile without a signed-in user.");
    }

    await writeUserIntakeProfile(userId, nextIntakeProfile);
    setIntakeProfile(nextIntakeProfile);
  };

  const signIn = async (email: string, password: string) => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Sign in"));
    }

    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error !== null) {
      throw new Error(`Supabase sign-in failed for "${email}": ${error.message}`);
    }
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Sign up"));
    }

    const { error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          full_name: fullName,
        },
      },
    });

    if (error !== null) {
      throw new Error(`Supabase sign-up failed for "${email}": ${error.message}`);
    }
  };

  const signOut = async () => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Sign out"));
    }

    const { error } = await getSupabaseClient().auth.signOut();

    if (error !== null) {
      throw new Error(`Supabase sign-out failed: ${error.message}`);
    }
  };

  const signInWithApple = async () => {
    if (isTestingBypassEnabled) {
      return;
    }

    if (configurationError !== null) {
      throw new Error(buildMissingConfigurationError("Apple Sign-In"));
    }

    if (Platform.OS !== "ios") {
      throw new Error("Apple Sign-In is currently available on iOS only in this app.");
    }

    const rawNonce = createAppleNonce();
    const credential = await AppleAuthentication.signInAsync({
      nonce: rawNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken === null) {
      throw new Error("Apple Sign-In completed without an identity token.");
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      access_token: credential.authorizationCode ?? undefined,
      nonce: rawNonce,
    });

    if (error !== null) {
      throw new Error(`Supabase Apple sign-in failed: ${error.message}`);
    }

    const formattedFullName = buildAppleFullName(credential.fullName);

    if (formattedFullName !== null) {
      const { error: updateUserError } = await client.auth.updateUser({
        data: {
          fullName: formattedFullName,
          full_name: formattedFullName,
        },
      });

      if (updateUserError !== null) {
        throw new Error(
          `Apple Sign-In succeeded, but saving the user name failed: ${updateUserError.message}`,
        );
      }
    }
  };

  return (
    <SessionContext.Provider
      value={{
        currentUserId: profile?.id ?? null,
        configurationError,
        isAppleAuthAvailable,
        isLoading,
        isOnboardingComplete: intakeProfile !== null,
        isTestingBypassEnabled,
        intakeProfile,
        profile,
        saveIntakeProfile,
        session,
        signInWithApple,
        signIn,
        signOut,
        signUp,
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

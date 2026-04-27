import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { type UserProfile } from "@/types/domain";

type SupabaseEnvironment = {
  anonKey: string;
  url: string;
};

const AUTH_BYPASS_ENABLED = false;
const BYPASS_PROFILE: UserProfile = {
  email: "demo@pyhsiotrack.local",
  fullName: "Demo Patient",
  id: "demo-user",
};

let cachedClient: SupabaseClient | null = null;

export function isAuthBypassEnabled() {
  const rawValue = process.env.EXPO_PUBLIC_AUTH_BYPASS;

  if (typeof rawValue !== "string") {
    return AUTH_BYPASS_ENABLED;
  }

  return rawValue === "true";
}

export function getBypassProfile() {
  return BYPASS_PROFILE;
}

function readSupabaseEnvironment() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  if (typeof anonKey !== "string" || anonKey.length === 0) {
    return null;
  }

  return {
    anonKey,
    url,
  } satisfies SupabaseEnvironment;
}

export function getSupabaseConfigurationError() {
  if (AUTH_BYPASS_ENABLED) {
    return null;
  }

  const environment = readSupabaseEnvironment();

  if (environment !== null) {
    return null;
  }

  return "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before using authentication.";
}

export function getSupabaseClient() {
  const environment = readSupabaseEnvironment();

  if (environment === null) {
    throw new Error(getSupabaseConfigurationError() ?? "Supabase is not configured.");
  }

  if (cachedClient !== null) {
    return cachedClient;
  }

  cachedClient = createClient(environment.url, environment.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: AsyncStorage,
    },
  });

  return cachedClient;
}

export function mapUserToProfile(user: Session["user"] | User | null) {
  if (user === null) {
    return null;
  }

  const fullNameMetadata =
    user.user_metadata["fullName"] ?? user.user_metadata["full_name"];
  const fullName =
    typeof fullNameMetadata === "string" && fullNameMetadata.trim().length > 0
      ? fullNameMetadata
      : null;

  return {
    email: user.email ?? "",
    fullName,
    id: user.id,
  } satisfies UserProfile;
}

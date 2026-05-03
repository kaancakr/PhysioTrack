const CLIENT_BACKEND_URL_ENV_KEY = "EXPO_PUBLIC_BACKEND_URL";
const SERVER_BACKEND_URL_ENV_KEY = "BACKEND_URL";

function normalizeBackendBaseUrl(rawValue: string) {
  return rawValue.trim().replace(/\/+$/, "");
}

export function getBackendBaseUrl() {
  const rawValue = process.env.BACKEND_URL;

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new Error(
      `Set ${SERVER_BACKEND_URL_ENV_KEY} before calling auth login API route.`,
    );
  }

  return rawValue.trim().replace(/\/+$/, "");
}

export function getBackendConfigurationError() {
  const rawClientValue = process.env.EXPO_PUBLIC_BACKEND_URL;
  const rawServerValue = process.env.BACKEND_URL;

  if (typeof rawClientValue === "string" && rawClientValue.trim().length > 0) {
    return null;
  }

  if (typeof rawServerValue === "string" && rawServerValue.trim().length > 0) {
    return null;
  }

  return `Set ${CLIENT_BACKEND_URL_ENV_KEY} for app authentication and ${SERVER_BACKEND_URL_ENV_KEY} for API routes.`;
}

export function getClientBackendBaseUrl() {
  const rawPublicValue = process.env.EXPO_PUBLIC_BACKEND_URL;
  const rawServerValue = process.env.BACKEND_URL;
  const resolvedValue =
    typeof rawPublicValue === "string" && rawPublicValue.trim().length > 0
      ? rawPublicValue
      : rawServerValue;

  if (typeof resolvedValue !== "string" || resolvedValue.trim().length === 0) {
    throw new Error(
      getBackendConfigurationError() ?? "Backend base URL is unavailable.",
    );
  }

  return normalizeBackendBaseUrl(resolvedValue);
}

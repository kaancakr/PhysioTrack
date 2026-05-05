import {
  normalizeJsonRequestBody,
  normalizeUtcDateTimes,
  parseAndNormalizeUtcJson,
} from "@/lib/datetime";
import { type AuthTokenPair } from "@/types/auth";

export class AuthRequestError extends Error {
  path: string;
  responseBody: string | null;
  status: number;

  constructor(path: string, status: number, responseBody: string | null) {
    super(`Auth request failed. path=${path} status=${status}`);
    this.name = "AuthRequestError";
    this.path = path;
    this.responseBody = responseBody;
    this.status = status;
  }
}

export class UnauthenticatedRequestError extends AuthRequestError {
  constructor(path: string, responseBody: string | null) {
    super(path, 401, responseBody);
    this.name = "UnauthenticatedRequestError";
  }
}

type AuthErrorResponseBody = {
  detail?: unknown;
  message?: unknown;
};

type CachedJsonResponse = {
  etag: string;
  payload: unknown;
};

type AuthTokenRefreshHandler = (
  expiredAccessToken: string | null,
) => Promise<AuthTokenPair | null>;
type UnauthorizedHandler = () => Promise<void> | void;
export type AuthFetchOptions = RequestInit & {
  authenticate?: boolean;
  handleUnauthorized?: boolean;
};

let registeredAuthTokenRefreshHandler: AuthTokenRefreshHandler | null = null;
let registeredUnauthorizedHandler: UnauthorizedHandler | null = null;
let currentAuthTokenPair: AuthTokenPair | null = null;
let pendingAccessTokenRefresh: Promise<string | null> | null = null;
const cachedGetJsonResponses = new Map<string, CachedJsonResponse>();
const ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 60;

export function registerAuthTokenRefreshHandler(
  handler: AuthTokenRefreshHandler,
) {
  registeredAuthTokenRefreshHandler = handler;
}

export function setAuthTokenPair(tokenPair: AuthTokenPair) {
  currentAuthTokenPair = tokenPair;
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  registeredUnauthorizedHandler = handler;
}

export function unregisterAuthTokenRefreshHandler(
  handler: AuthTokenRefreshHandler,
) {
  if (registeredAuthTokenRefreshHandler !== handler) {
    return;
  }

  registeredAuthTokenRefreshHandler = null;
}

export function clearAuthTokenPair() {
  currentAuthTokenPair = null;
  cachedGetJsonResponses.clear();
}

export function unregisterUnauthorizedHandler(handler: UnauthorizedHandler) {
  if (registeredUnauthorizedHandler !== handler) {
    return;
  }

  registeredUnauthorizedHandler = null;
}

export function isUnauthenticatedRequestError(
  error: unknown,
): error is UnauthenticatedRequestError {
  return error instanceof UnauthenticatedRequestError;
}

function isAuthErrorResponseBody(
  value: unknown,
): value is AuthErrorResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return true;
}

function parseAuthErrorResponseMessage(responseBody: string | null) {
  if (responseBody === null) {
    return null;
  }

  const trimmedResponseBody = responseBody.trim();

  if (trimmedResponseBody.length === 0) {
    return null;
  }

  try {
    const parsedBody = JSON.parse(trimmedResponseBody) as unknown;

    if (!isAuthErrorResponseBody(parsedBody)) {
      return trimmedResponseBody;
    }

    if (typeof parsedBody.message === "string") {
      return parsedBody.message;
    }

    if (typeof parsedBody.detail === "string") {
      return parsedBody.detail;
    }
  } catch {
    return trimmedResponseBody;
  }

  return trimmedResponseBody;
}

export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof AuthRequestError) {
    const responseMessage = parseAuthErrorResponseMessage(error.responseBody);

    if (responseMessage !== null) {
      return responseMessage;
    }

    return fallbackMessage;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function buildAuthHeaders(
  accessToken: string | null,
  options?: AuthFetchOptions,
): Headers {
  const headers = new Headers(options?.headers);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (accessToken !== null && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

function isGetRequestMethod(method: string | undefined): boolean {
  if (typeof method === "undefined") {
    return true;
  }

  return method.toUpperCase() === "GET";
}

function getCachedJsonResponse(path: string): CachedJsonResponse | null {
  return cachedGetJsonResponses.get(path) ?? null;
}

function buildRequestHeadersWithETag(
  headersInit: HeadersInit | undefined,
  etag: string,
): Headers {
  const headers = new Headers(headersInit);

  if (!headers.has("if-none-match")) {
    headers.set("if-none-match", etag);
  }

  return headers;
}

function readResponseETag(response: Response): string | null {
  const etag = response.headers.get("etag");

  if (etag === null || etag.trim().length === 0) {
    return null;
  }

  return etag;
}

function parseJsonResponseText<TResponse>(
  responseText: string,
  path: string,
  status: number,
): TResponse {
  try {
    return JSON.parse(responseText) as TResponse;
  } catch {
    throw new AuthRequestError(path, status, responseText);
  }
}

async function refreshAccessTokenForUnauthorizedRequest(
  expiredAccessToken: string | null,
) {
  if (registeredAuthTokenRefreshHandler === null) {
    return null;
  }

  if (pendingAccessTokenRefresh !== null) {
    return pendingAccessTokenRefresh;
  }

  pendingAccessTokenRefresh = (async () => {
    const refreshedTokenPair =
      await registeredAuthTokenRefreshHandler(expiredAccessToken);

    if (refreshedTokenPair === null) {
      return null;
    }

    currentAuthTokenPair = refreshedTokenPair;
    return refreshedTokenPair.access;
  })();

  try {
    return await pendingAccessTokenRefresh;
  } finally {
    pendingAccessTokenRefresh = null;
  }
}

function getCurrentAccessToken() {
  return currentAuthTokenPair?.access ?? null;
}

function decodeBase64UrlSegment(value: string): string {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + paddingLength,
    "=",
  );

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(paddedValue);
  }

  throw new Error("Base64 decoding is unavailable in this runtime.");
}

function readJwtExpirationTimestamp(accessToken: string): number | null {
  const tokenParts = accessToken.split(".");

  if (tokenParts.length !== 3) {
    throw new Error("Access token is not a valid JWT.");
  }

  const payload = JSON.parse(decodeBase64UrlSegment(tokenParts[1])) as unknown;

  if (typeof payload !== "object" || payload === null || !("exp" in payload)) {
    return null;
  }

  const expirationTimestamp = payload.exp;

  if (typeof expirationTimestamp !== "number") {
    throw new Error("JWT exp claim must be a number.");
  }

  return expirationTimestamp;
}

function shouldRefreshAccessTokenBeforeRequest(accessToken: string): boolean {
  const expirationTimestamp = readJwtExpirationTimestamp(accessToken);

  if (expirationTimestamp === null) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  return (
    expirationTimestamp - currentTimestamp <=
    ACCESS_TOKEN_REFRESH_BUFFER_SECONDS
  );
}

async function getAccessTokenForRequest(
  shouldAuthenticate: boolean,
): Promise<string | null> {
  if (!shouldAuthenticate) {
    return null;
  }

  const currentAccessToken = getCurrentAccessToken();

  if (currentAccessToken === null) {
    return null;
  }

  if (!shouldRefreshAccessTokenBeforeRequest(currentAccessToken)) {
    return currentAccessToken;
  }

  const refreshedAccessToken =
    await refreshAccessTokenForUnauthorizedRequest(currentAccessToken);

  if (refreshedAccessToken === null) {
    return currentAccessToken;
  }

  return refreshedAccessToken;
}

async function authFetchWithRefreshRetry(
  url: string,
  options: AuthFetchOptions | undefined,
  refreshAttemptCount: number,
): Promise<Response> {
  const shouldAuthenticate = options?.authenticate !== false;
  const shouldHandleUnauthorized =
    options?.handleUnauthorized ?? shouldAuthenticate;
  const accessToken = await getAccessTokenForRequest(shouldAuthenticate);
  const response = await fetch(url, {
    ...options,
    body: normalizeJsonRequestBody(options?.body),
    headers: buildAuthHeaders(accessToken, options),
  });

  if (
    response.status === 401 &&
    accessToken !== null &&
    refreshAttemptCount === 0
  ) {
    const refreshedAccessToken =
      await refreshAccessTokenForUnauthorizedRequest(accessToken);

    if (refreshedAccessToken !== null) {
      return authFetchWithRefreshRetry(url, options, 1);
    }
  }

  if (response.status === 304) {
    return response;
  }

  if (!response.ok) {
    const responseText = await response.text();

    if (response.status === 401 && shouldHandleUnauthorized) {
      await registeredUnauthorizedHandler?.();
      throw new UnauthenticatedRequestError(url, responseText);
    }

    throw new AuthRequestError(url, response.status, responseText);
  }

  return response;
}

export async function authFetch(
  url: string,
  options?: AuthFetchOptions,
): Promise<Response> {
  return authFetchWithRefreshRetry(url, options, 0);
}

export async function requestAuthJson<TResponse>(
  path: string,
  options?: AuthFetchOptions,
): Promise<TResponse> {
  const isGetRequest = isGetRequestMethod(options?.method);
  const cachedResponse = isGetRequest ? getCachedJsonResponse(path) : null;
  const requestOptions =
    cachedResponse === null
      ? options
      : ({
          ...options,
          headers: buildRequestHeadersWithETag(
            options?.headers,
            cachedResponse.etag,
          ),
        } satisfies AuthFetchOptions);
  const response = await authFetch(path, requestOptions);

  if (response.status === 304) {
    if (cachedResponse === null) {
      throw new AuthRequestError(path, 304, null);
    }

    return cachedResponse.payload as TResponse;
  }

  const responseText = await response.text();
  const parsedResponse = parseJsonResponseText<TResponse>(
    responseText,
    path,
    response.status,
  );
  const normalizedResponse = normalizeUtcDateTimes(parsedResponse);

  if (isGetRequest) {
    const etag = readResponseETag(response);

    if (etag !== null) {
      cachedGetJsonResponses.set(path, {
        etag,
        payload: normalizedResponse,
      });
    }
  }

  return normalizedResponse;
}

export async function parseAuthJsonResponse<TResponse>(
  response: Response,
  path?: string,
): Promise<TResponse> {
  const responseText = await response.text();
  const responsePath = path ?? response.url;

  try {
    return parseAndNormalizeUtcJson<TResponse>(responseText, responsePath);
  } catch {
    throw new AuthRequestError(responsePath, response.status, responseText);
  }
}

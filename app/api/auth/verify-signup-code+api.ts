const BACKEND_URL_ENV_KEY = "BACKEND_URL";
const RETRY_ATTEMPTS = 3;

function getBackendBaseUrl() {
  const rawValue = process.env.BACKEND_URL;

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new Error(
      `Set ${BACKEND_URL_ENV_KEY} before calling auth verify signup code API route.`,
    );
  }

  return rawValue.trim().replace(/\/+$/, "");
}

export async function POST(request: Request) {
  const authorizationHeader = request.headers.get("authorization");
  const contentTypeHeader = request.headers.get("content-type");
  const requestBody = await request.text();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
      });

      if (contentTypeHeader !== null) {
        headers.set("content-type", contentTypeHeader);
      }

      if (authorizationHeader !== null) {
        headers.set("authorization", authorizationHeader);
      }

      const response = await fetch(`${getBackendBaseUrl()}/api/auth/verify-signup-code`, {
        body: requestBody,
        headers,
        method: "POST",
      });
      const responseText = await response.text();

      return new Response(responseText, {
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "application/json",
        },
        status: response.status,
      });
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_ATTEMPTS) {
        console.warn("Backend auth verify signup code request retry", {
          attempt,
          path: "/api/auth/verify-signup-code",
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Backend auth verify signup code request failed for path "/api/auth/verify-signup-code".');
}

const BACKEND_URL_ENV_KEY = "BACKEND_URL";
const RETRY_ATTEMPTS = 3;

function getBackendBaseUrl() {
  const rawValue = process.env.BACKEND_URL;

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new Error(`Set ${BACKEND_URL_ENV_KEY} before calling auth me API route.`);
  }

  return rawValue.trim().replace(/\/+$/, "");
}

export async function GET(request: Request) {
  const authorizationHeader = request.headers.get("authorization");
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
      });

      if (authorizationHeader !== null) {
        headers.set("authorization", authorizationHeader);
      }

      const response = await fetch(`${getBackendBaseUrl()}/api/auth/me`, {
        headers,
        method: "GET",
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
        console.warn("Backend auth me request retry", {
          attempt,
          path: "/api/auth/me",
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Backend auth me request failed for path "/api/auth/me".');
}

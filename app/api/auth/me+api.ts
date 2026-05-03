import { getBackendBaseUrl } from "@/lib/backend";
const RETRY_ATTEMPTS = 3;

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
          "Content-Type":
            response.headers.get("content-type") ?? "application/json",
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

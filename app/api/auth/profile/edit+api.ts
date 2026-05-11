import { getBackendBaseUrl } from "@/lib/backend";

const RETRY_ATTEMPTS = 3;

export async function PATCH(request: Request) {
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

      // Backend documentation shows PATCH /api/users/me/
      const response = await fetch(`${getBackendBaseUrl()}/api/users/me/`, {
        body: requestBody,
        headers,
        method: "PATCH",
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
        console.warn("Backend profile edit request retry", {
          attempt,
          path: "/api/users/me/",
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        'Backend profile edit request failed for path "/api/users/me/".',
      );
}

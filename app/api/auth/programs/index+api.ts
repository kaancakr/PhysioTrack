import { getBackendBaseUrl } from "@/lib/backend";

const RETRY_ATTEMPTS = 3;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorizationHeader = request.headers.get("authorization");
  const ifNoneMatchHeader = request.headers.get("if-none-match");
  const queryString = searchParams.toString();
  const backendPath =
    queryString.length > 0 ? `/api/programs/?${queryString}` : "/api/programs/";
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
      });

      if (authorizationHeader !== null) {
        headers.set("authorization", authorizationHeader);
      }

      if (ifNoneMatchHeader !== null) {
        headers.set("if-none-match", ifNoneMatchHeader);
      }

      const response = await fetch(`${getBackendBaseUrl()}${backendPath}`, {
        headers,
        method: "GET",
      });
      const responseText = await response.text();
      const responseHeaders = new Headers();
      const contentTypeHeader = response.headers.get("content-type");
      const etagHeader = response.headers.get("etag");

      if (contentTypeHeader !== null) {
        responseHeaders.set("Content-Type", contentTypeHeader);
      }

      if (etagHeader !== null) {
        responseHeaders.set("ETag", etagHeader);
      }

      return new Response(response.status === 304 ? null : responseText, {
        headers: responseHeaders,
        status: response.status,
      });
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_ATTEMPTS) {
        console.warn("Backend programs list request retry", {
          attempt,
          path: backendPath,
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Backend programs list request failed for path "${backendPath}".`,
      );
}

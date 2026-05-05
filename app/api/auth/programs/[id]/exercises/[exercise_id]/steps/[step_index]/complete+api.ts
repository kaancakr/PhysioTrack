import { getBackendBaseUrl } from "@/lib/backend";

const RETRY_ATTEMPTS = 3;

type CompleteExerciseStepRouteParams = {
  exercise_id: string;
  id: string;
  step_index: string;
};

export async function POST(
  request: Request,
  params: CompleteExerciseStepRouteParams,
) {
  const authorizationHeader = request.headers.get("authorization");
  const contentTypeHeader = request.headers.get("content-type");
  const requestBody = await request.text();
  const backendPath = `/api/programs/${params.id}/exercises/${params.exercise_id}/steps/${params.step_index}/complete/`;
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

      const response = await fetch(`${getBackendBaseUrl()}${backendPath}`, {
        body: requestBody,
        headers,
        method: "POST",
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
        console.warn("Backend complete exercise step request retry", {
          attempt,
          path: backendPath,
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Backend complete exercise step request failed for path "${backendPath}".`,
      );
}

import { getBackendBaseUrl } from "@/lib/backend";

export async function POST(
  request: Request,
  { exercise_id, id }: { exercise_id: string; id: string },
) {
  console.log("FAVORITE API ROUTE PARAMS:", { exercise_id, id });
  const authorizationHeader = request.headers.get("authorization");
  const backendPath = `/api/programs/${id}/exercises/${exercise_id}/favorite/`;
  console.log("CONSTRUCTED BACKEND PATH:", backendPath);

  try {
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    const requestBody = await request.text();

    if (authorizationHeader !== null) {
      headers.set("authorization", authorizationHeader);
    }

    const response = await fetch(`${getBackendBaseUrl()}${backendPath}`, {
      body: requestBody,
      headers,
      method: "POST",
    });

    const responseText = await response.text();
    console.log("BACKEND RESPONSE STATUS:", response.status);
    console.log("BACKEND RESPONSE TEXT:", responseText);
    const responseHeaders = new Headers();
    const contentTypeHeader = response.headers.get("content-type");

    if (contentTypeHeader !== null) {
      responseHeaders.set("Content-Type", contentTypeHeader);
    }

    const safeResponseText = responseText.trim() === "" ? "{}" : responseText;

    return new Response(safeResponseText, {
      headers: responseHeaders,
      status: response.status,
    });
  } catch (error) {
    console.error("Backend favorite toggle request failed", error);
    return new Response(
      JSON.stringify({ error: "Failed to toggle favorite status" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
}

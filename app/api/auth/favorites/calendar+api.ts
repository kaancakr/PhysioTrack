import { getBackendBaseUrl } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorizationHeader = request.headers.get("authorization");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let backendPath = "/api/programs/favorites/calendar/";
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  
  if (params.toString()) {
    backendPath += `?${params.toString()}`;
  }

  try {
    const headers = new Headers({
      Accept: "application/json",
    });

    if (authorizationHeader !== null) {
      headers.set("authorization", authorizationHeader);
    }

    const response = await fetch(`${getBackendBaseUrl()}${backendPath}`, {
      headers,
      method: "GET",
    });

    const responseText = await response.text();
    const responseHeaders = new Headers();
    const contentTypeHeader = response.headers.get("content-type");

    if (contentTypeHeader !== null) {
      responseHeaders.set("Content-Type", contentTypeHeader);
    }

    return new Response(responseText, {
      headers: responseHeaders,
      status: response.status,
    });
  } catch (error) {
    console.error("Backend favorite calendar request failed", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch favorite calendar" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
}

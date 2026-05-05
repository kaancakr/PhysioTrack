import { getBackendBaseUrl } from "@/lib/backend";

const RETRY_ATTEMPTS = 3;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
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

            // Django backend'e parametrelerle birlikte istek atar
            const response = await fetch(`${getBackendBaseUrl()}/api/programs/?${searchParams.toString()}`, {
                headers,
                method: "GET",
            });

            const responseText = await response.text();

            // Terminalde veriyi görmek için loglar
            console.log("Gelen Veri Durumu:", response.status);
            console.log("İçerik özeti:", responseText.substring(0, 100) + "...");

            return new Response(responseText, {
                headers: {
                    "Content-Type": response.headers.get("content-type") ?? "application/json",
                },
                status: response.status,
            });
        } catch (error) {
            lastError = error;
            if (attempt < RETRY_ATTEMPTS) {
                console.warn("Backend programs list request retry", { attempt, path: "/api/programs/" });
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error('Backend programs request failed for path "/api/programs/".');
}
import { getBackendBaseUrl } from "@/lib/backend";

const RETRY_ATTEMPTS = 3;

// Expo Router, URL'deki [id] kısmını otomatik olarak ikinci parametreye (props) paslar.
export async function GET(request: Request, { id }: { id: string }) {
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

            const response = await fetch(
                `${getBackendBaseUrl()}/api/programs/${id}/`,
                {
                    headers,
                    method: "GET",
                },
            );

            const responseText = await response.text();

            // Terminalde ne geldiğini görmek istersen:
            console.log(`Program Detay (${id}) Status:`, response.status);

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
                console.warn(`Backend program detail retry: ${attempt} for ID: ${id}`);
            }
        }
    }

    return new Response(
        JSON.stringify({ error: "Program detayı getirilemedi." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
    );
}
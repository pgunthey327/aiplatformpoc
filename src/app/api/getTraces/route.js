import { getAllTraces } from "@/lib/adaptors/langfuse-adaptors.js";
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const agentName = searchParams.get("agentName");
        const agentId = searchParams.get("agentId");
        const version = searchParams.get("version");

        console.log({ agentName, agentId, version });

        const traces = await getAllTraces(
            agentName,
            agentId,
            version
        );

        return new Response(
            JSON.stringify({
                data: traces.data || [],
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error("API ERROR:", err);

        return new Response(
            JSON.stringify({
                error: err.message,
            }),
            { status: 500 }
        );
    }
}

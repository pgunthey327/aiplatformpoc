import { getAllTraces } from "@/lib/adaptors/langfuse-adaptors.js";
export async function GET(request) {
    // For example, fetch data from your DB here
    const traces = await getAllTraces()
    return new Response(JSON.stringify(traces), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

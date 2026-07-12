import { getFullTrace } from "@/lib/adaptors/langfuse-adaptors.js";

export async function GET(request, { params }) {
  try {
    const { traceId } = await params;
    const trace = await getFullTrace(traceId);
    return Response.json({ success: true, data: trace }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

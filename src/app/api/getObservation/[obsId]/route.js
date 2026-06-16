import { getTraceByObservationId } from "@/lib/adaptors/langfuse-adaptors.js";

export async function GET(request, { params }) {
  try {
    const { obsId } = await params;

    const observation =
      await getTraceByObservationId(obsId);

    if (!observation) {
      return Response.json(
        {
          success: false,
          message: "Observation not found",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
        data: observation.data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
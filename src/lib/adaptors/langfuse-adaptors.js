const { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST } = require("@/constants");
const { Langfuse } = require("langfuse");

const langfuse = new Langfuse({
    publicKey: LANGFUSE_PUBLIC_KEY,
    secretKey: LANGFUSE_SECRET_KEY,
    baseUrl: LANGFUSE_HOST, // cloud or local
});

export const getAllTraces = async () => {
    const traces = await langfuse.fetchTraces({
        limit: 100,
    });
    return traces;
}

export const getTraceByObservationId = async (obsId) => {
    try {
        const observation = await langfuse.fetchObservation(obsId);

        if (
            observation?.data?.error ===
            "LangfuseNotFoundError"
        ) {
            return null;
        }

        return observation;
    } catch (error) {
        console.error("Langfuse Error:", error);

        return null;
    }
};

// module.exports = { getAllTraces, getTraceByObservationId }
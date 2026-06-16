import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST, // only if self-hosted
});

export const getAllTraces = async (agentName, agentId, version) => {
  const tags = [];

  if (agentName) tags.push(`agent:${agentName}`);
  if (agentId) tags.push(`id:${agentId}`);
  if (version) tags.push(`version:${version}`);

  const query = {
    limit: 100,
  };

  if (tags.length > 0) {
    query.tags = tags;
  }

  try {
     const result = await langfuse.api.trace.list(query);
    return result;
  } catch (err) {
    console.error("Langfuse error:", err);
    throw err;
  }
};

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
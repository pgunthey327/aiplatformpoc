import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST, // only if self-hosted
});

export const getAllTraces = async (agentName, agentId, version) => {

  try {
    if (!agentName && !agentId && !version) {
      const result = await langfuse.fetchTraces({
        limit: 100,
      });
      return result;
    }
    if (agentName || agentId || version) {
      const baseUrl = `${process.env.LANGFUSE_HOST}/api/public/traces`;

      const params = new URLSearchParams();

      // always add limit
      params.append("limit", "100");

      const tags = [];

      if (agentName) tags.push(`agent:${agentName}`);
      if (agentId) tags.push(`id:${agentId}`);
      if (version) tags.push(`version:${version}`);

      // if any tag exists → add to query
      tags.forEach((tag) => {
        params.append("tags", tag);
      });



      // -----------------------------
      // Build final URL
      // -----------------------------
      const url = `${baseUrl}?${params.toString()}`;

      // -----------------------------
      // Auth (Langfuse REST requires Basic Auth)
      // -----------------------------
      const auth = Buffer.from(
        `${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`
      ).toString("base64");

      // -----------------------------
      // Fetch directly from REST API
      // -----------------------------
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Langfuse API error: ${res.status}`);
      }

      const data = await res.json();

      return data;
    }
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
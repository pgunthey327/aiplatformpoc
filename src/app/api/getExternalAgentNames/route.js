export async function GET() {
  try {
    const auth = Buffer.from(
      `${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`
    ).toString("base64");

    const res = await fetch(`${process.env.LANGFUSE_HOST}/api/public/traces?limit=100`, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Langfuse API error: ${res.status}`);

    const raw = await res.json();
    const names = new Set();

    for (const trace of raw.data || []) {
      let meta = trace.metadata;
      if (typeof meta === "string") { try { meta = JSON.parse(meta); } catch { meta = {}; } }

      const resourceName = meta?.resourceAttributes?.agentName;
      if (resourceName) { names.add(resourceName); continue; }

      const attrName = meta?.attributes?.["gen_ai.agent.name"];
      if (attrName) { names.add(attrName); continue; }
    }

    return Response.json({ data: [...names].sort() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

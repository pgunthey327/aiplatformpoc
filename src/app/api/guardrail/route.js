import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

const guardrailPromptName = (agentName) => `agent-guardrail-${agentName}`;

export async function POST(req) {
  try {
    const { agentName, guardrail } = await req.json();

    if (!agentName || !guardrail) {
      return Response.json({ success: false, message: "agentName and guardrail required" }, { status: 400 });
    }

    await langfuse.createPrompt({
      name: guardrailPromptName(agentName),
      prompt: guardrail,
      labels: ["production"],
      type: "text",
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Guardrail POST error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const agentName = searchParams.get("agentName");

    if (!agentName) {
      return Response.json({ success: false, message: "agentName required" }, { status: 400 });
    }

    const prompt = await langfuse.getPrompt(guardrailPromptName(agentName), undefined, { cacheTtlSeconds: 0 });

    return Response.json({ success: true, data: prompt.prompt });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.toLowerCase().includes("not found")) {
      return Response.json({ success: true, data: "none" });
    }
    console.error("Guardrail GET error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

const promptName = (agentName) => `agent-prompts-${agentName}`;

export async function POST(req) {
  try {
    const { agentName, prompts } = await req.json();

    if (!agentName || !Array.isArray(prompts)) {
      return Response.json({ success: false, message: "agentName and prompts array required" }, { status: 400 });
    }

    const filtered = prompts.map((p) => p.trim()).filter(Boolean);

    await langfuse.createPrompt({
      name: promptName(agentName),
      prompt: JSON.stringify(filtered),
      labels: ["production"],
      type: "text",
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Prompts POST error:", err);
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

    const prompt = await langfuse.getPrompt(promptName(agentName), undefined, { cacheTtlSeconds: 0 });
    const prompts = JSON.parse(prompt.prompt);

    return Response.json({ success: true, data: prompts });
  } catch (err) {
    // Prompt not found is not an error — agent just has no prompts yet
    if (err.message?.includes("404") || err.message?.toLowerCase().includes("not found")) {
      return Response.json({ success: true, data: [] });
    }
    console.error("Prompts GET error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

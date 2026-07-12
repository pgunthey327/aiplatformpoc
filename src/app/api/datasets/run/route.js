import { Langfuse } from "langfuse";
import axios from "axios";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

export async function POST(req) {
  const { agentName, version, agentId, itemId, prompt, model, provider, runName } = await req.json();

  if (provider?.toLowerCase() !== "ollama") {
    return Response.json(
      {
        success: false,
        message: `Automated regression runs are currently supported for Ollama agents only. This agent uses ${provider}.`,
        unsupported: true,
      },
      { status: 422 }
    );
  }

  const tags = ["regression"];
  if (agentName) tags.push(`agent:${agentName}`);
  if (agentId)   tags.push(`id:${agentId}`);
  if (version)   tags.push(`version:${version}`);

  const trace = langfuse.trace({
    name: `regression-${agentName}`,
    input: { prompt },
    tags,
    metadata: { agentName, version, runType: "regression", runName },
  });

  try {
    const startTime = new Date();

    const response = await axios.post("http://localhost:11434/api/chat", {
      model: model || "qwen3:0.6b",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const output = response.data?.message?.content ?? JSON.stringify(response.data);
    const endTime = new Date();

    trace.generation({
      name: "regression-generation",
      startTime,
      endTime,
      input: prompt,
      output,
      model,
      usage: {
        input: response.data.prompt_eval_count ?? 0,
        output: response.data.eval_count ?? 0,
        total: (response.data.prompt_eval_count ?? 0) + (response.data.eval_count ?? 0),
      },
    });

    trace.update({ output });

    // Link this trace to the dataset item so Langfuse records it as an experiment run
    try {
      const dataset = await langfuse.getDataset(`agent-dataset-${agentName}`);
      const item = dataset.items.find((i) => i.id === itemId);
      if (item) {
        await item.link(trace, runName);
      }
    } catch (linkErr) {
      console.warn("Dataset link warning:", linkErr.message);
    }

    await langfuse.flush();

    return Response.json({ success: true, output, traceId: trace.id });
  } catch (err) {
    trace.event({ name: "error", metadata: { message: err.message } });
    await langfuse.flush();
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

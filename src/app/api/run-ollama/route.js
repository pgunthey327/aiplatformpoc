import axios from "axios";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

export async function POST(req) {
  const {
    prompt,
    provider: selectedProvider,
    model: selectedModel,
    agentConfig,
  } = await req.json();

  const agent = agentConfig ?? {};
  const model = selectedModel || agent.model || "qwen3:0.6b";
  const provider = selectedProvider || agent.provider || "ollama";

  const tags = [];
  if (agent.agentName) tags.push(`agent:${agent.agentName}`);
  if (agent.id) tags.push(`id:${agent.id}`);
  if (agent.version) tags.push(`version:${agent.version}`);

  const trace = langfuse.trace({
    name: "ollama-chat",
    input: prompt,
    tags,
    metadata: {
      model,
      provider,
    },
  });

  try {
    const startTime = new Date();

    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }
    );

    const output =
      response.data?.message?.content ??
      JSON.stringify(response.data);

    const endTime = new Date();

    trace.generation({
      name: "ollama-generation",
      startTime,
      endTime,
      input: prompt,
      output,
      model,
      usage: {
        input: response.data.prompt_eval_count,
        output: response.data.eval_count,
        total:
          response.data.prompt_eval_count +
          response.data.eval_count,
      },
    });

    trace.update({
      output,
      metadata: {
        inputTokens: response.data.prompt_eval_count,
        outputTokens: response.data.eval_count,
        totalTokens:
          response.data.prompt_eval_count +
          response.data.eval_count,
      },
    });

    await langfuse.flush();
    // await langfuse.shutdownAsync();

    return Response.json({ output });
  } catch (err) {
    trace.event({
      name: "error",
      metadata: { message: err.message },
    });

    await langfuse.flush();
    // await langfuse.shutdownAsync();

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
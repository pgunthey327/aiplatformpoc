import axios from "axios";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

export async function POST(req) {
  const { prompt } = await req.json();

  const trace = langfuse.trace({
    name: "ollama-chat",
    input: prompt,
    metadata: {
      model: "llama3.1",
      provider: "ollama",
    },
  });

  try {
    const startTime = new Date();

    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3.1",
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
      model: "llama3.1",
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
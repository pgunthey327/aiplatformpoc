import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

const datasetName = (agentName) => `agent-dataset-${agentName}`;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const agentName = searchParams.get("agentName");

  if (!agentName) {
    return Response.json({ success: false, message: "agentName required" }, { status: 400 });
  }

  try {
    const dataset = await langfuse.getDataset(datasetName(agentName));
    return Response.json({
      success: true,
      data: {
        name: dataset.name,
        description: dataset.description,
        items: dataset.items.map((item) => ({
          id: item.id,
          input: item.input,
          expectedOutput: item.expectedOutput,
          metadata: item.metadata,
          status: item.status,
        })),
      },
    });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.toLowerCase().includes("not found")) {
      return Response.json({ success: true, data: null });
    }
    console.error("Dataset GET error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json();
  const { agentName, prompts, mode, itemId, itemInput, expectedOutput } = body;

  if (!agentName) {
    return Response.json({ success: false, message: "agentName required" }, { status: 400 });
  }

  try {
    if (mode === "setBaseline") {
      // Upsert the item with the expected output (keeps existing input)
      await langfuse.createDatasetItem({
        datasetName: datasetName(agentName),
        id: itemId,
        input: itemInput,
        expectedOutput: { text: expectedOutput },
      });
      return Response.json({ success: true });
    }

    // Default mode: seed — create dataset and populate with registration prompts
    await langfuse.createDataset({
      name: datasetName(agentName),
      description: `Regression test dataset for agent: ${agentName}`,
      metadata: { agentName },
    });

    const created = [];
    if (Array.isArray(prompts) && prompts.length > 0) {
      for (const prompt of prompts.filter(Boolean)) {
        const item = await langfuse.createDatasetItem({
          datasetName: datasetName(agentName),
          input: { prompt },
          expectedOutput: null,
          metadata: { source: "registration", agentName },
        });
        created.push(item);
      }
    }

    return Response.json({ success: true, created: created.length });
  } catch (err) {
    console.error("Dataset POST error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [model, setModel] = useState("llama3.1");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/run-ollama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
        }),
      });

      const data = await res.json();

      setResponse(data.output || "");
    } catch (error) {
      console.error(error);
      setResponse("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-8 py-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Ollama Chat
        </h1>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Model
          </label>

          <Select
            value={model}
            onValueChange={setModel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="llama3.1">
                llama3.1
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Prompt
          </label>

          <Textarea
            className="w-full min-h-[200px]"
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Send"}
        </Button>

        {response && (
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">
              Response
            </h2>

            <div className="whitespace-pre-wrap break-words">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PROVIDER_MODELS = {
  OpenAI: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  Anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-3-5-sonnet-20241022"],
  Google: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  Ollama: ["llama3.1", "llama3", "mistral", "codellama", "phi3", "qwen2", "qwen3:0.6b"],
  Mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "mixtral-8x7b"],
  Cohere: ["command-r-plus", "command-r", "command-light"],
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [agentJson, setAgentJson] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");

  const [agents, setAgents] = useState({});
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [agentPrompts, setAgentPrompts] = useState([]);
  const [promptsLoading, setPromptsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then((r) => setAgents(r.data || {}));
  }, []);

  const agentNames = [...new Set(Object.values(agents).map((a) => a.agentName))];

  const handleAgentSelect = async (name) => {
    setSelectedAgentName(name);
    setAgentPrompts([]);
    setPromptsLoading(true);
    try {
      const res = await fetch(`/api/prompts?agentName=${encodeURIComponent(name)}`);
      const result = await res.json();
      setAgentPrompts(result.data || []);
    } finally {
      setPromptsLoading(false);
    }
  };

  const handleProviderChange = (val) => {
    setProvider(val);
    setModel("");
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    let agentConfig = null;

    if (agentJson.trim()) {
      try {
        agentConfig = JSON.parse(agentJson);
      } catch {
        setResponse("Invalid config, please correct agentConfig");
        return;
      }
    }

    try {
      setLoading(true);

      const res = await fetch("/api/run-ollama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          agentConfig,
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
          Test Your Agent
        </h1>

        {/* Agent selector + prompts */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Agent</Label>
            <Select value={selectedAgentName} onValueChange={handleAgentSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an agent to load its prompts" />
              </SelectTrigger>
              <SelectContent position="popper">
                {agentNames.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {promptsLoading && (
            <p className="text-sm text-muted-foreground">Loading prompts…</p>
          )}

          {!promptsLoading && agentPrompts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prompts</Label>
              <div className="flex flex-wrap gap-2">
                {agentPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="rounded-md border bg-muted px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors max-w-xs truncate"
                    title={p}
                  >
                    {p.length > 60 ? p.slice(0, 60) + "…" : p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Click a prompt to load it into the prompt box below.</p>
            </div>
          )}

          {!promptsLoading && selectedAgentName && agentPrompts.length === 0 && (
            <p className="text-sm text-muted-foreground">No prompts registered for this agent.</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Provider
            </label>

            <Select
              value={provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>

              <SelectContent position="popper">
                {Object.keys(PROVIDER_MODELS).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Model
            </label>

            <Select
              value={model}
              onValueChange={setModel}
              disabled={!provider}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    provider
                      ? "Select a model"
                      : "Select a provider first"
                  }
                />
              </SelectTrigger>

              <SelectContent position="popper">
                {(PROVIDER_MODELS[provider] ?? []).map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Agent Config (JSON)
          </label>

          <Textarea
            className="w-full min-h-35 font-mono text-sm"
            placeholder='Paste the agent config JSON copied from Register Agent, e.g. { "id": "...", "agentName": "...", "version": "...", "provider": "...", "model": "..." }'
            value={agentJson}
            onChange={(e) => setAgentJson(e.target.value)}
          />
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
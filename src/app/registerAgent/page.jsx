"use client";

import { useState } from "react";
import {
  Bot,
  Cpu,
  Layers,
  Tag,
  FileText,
  Copy,
  Check,
  Code2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDER_MODELS = {
  OpenAI: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  Anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-3-5-sonnet-20241022"],
  Google: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  Ollama: ["llama3.1", "llama3", "mistral", "codellama", "phi3", "qwen2", "qwen3:0.6b"],
  Mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "mixtral-8x7b"],
  Cohere: ["command-r-plus", "command-r", "command-light"],
  "GitHub Copilot": ["gpt-4o", "gpt-4.1", "o3-mini", "o1", "claude-3-5-sonnet", "claude-3-7-sonnet", "gemini-2.0-flash"],
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Page() {
  const [formData, setFormData] = useState({
    agentName: "",
    description: "",
    tags: "",
    provider: "",
    model: "",
    version: "",
    agentType: "",
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [createdAgent, setCreatedAgent] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "provider" ? { model: "" } : {}),
    }));
  };

  const copyConfig = async () => {
    if (!createdAgent) return;

    const text =
      createdAgent.agentType === "markdown" ? markdownPreview : jsonPreview;

    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Failed to register agent"
        );
      }

      setCreatedAgent(result.data);
      setShowDialog(true);

      setFormData({
        agentName: "",
        description: "",
        tags: "",
        provider: "",
        model: "",
        version: "",
        agentType: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const configFields = createdAgent
    ? {
        id: createdAgent.id,
        agentName: createdAgent.agentName,
        version: createdAgent.version,
        provider: createdAgent.provider,
        model: createdAgent.model,
      }
    : null;

  const jsonPreview = configFields ? JSON.stringify(configFields, null, 2) : "";

  const markdownPreview = configFields
    ? Object.entries(configFields)
        .map(([k, v]) => `${k}=${v}`)
        .join(",")
    : "";

  return (
    <>
      <div className="min-h-screen bg-muted/30 p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Register AI Agent
              </CardTitle>

              <CardDescription>
                Configure your AI agent and generate
                tracing/monitoring configuration.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Bot size={16} />
                      Agent Name
                    </Label>

                    <Input
                      name="agentName"
                      placeholder="Customer Support Agent"
                      value={formData.agentName}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Tag size={16} />
                      Version
                    </Label>

                    <Input
                      name="version"
                      placeholder="v1.0.0"
                      value={formData.version}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Layers size={16} />
                      Provider
                    </Label>

                    <Select
                      value={formData.provider}
                      onValueChange={(val) => handleSelectChange("provider", val)}
                      required
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {Object.keys(PROVIDER_MODELS).map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Cpu size={16} />
                      Model
                    </Label>

                    <Select
                      value={formData.model}
                      onValueChange={(val) => handleSelectChange("model", val)}
                      disabled={!formData.provider}
                      required
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder={formData.provider ? "Select a model" : "Select a provider first"} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {(PROVIDER_MODELS[formData.provider] ?? []).map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Code2 size={16} />
                      Agent Type
                    </Label>

                    <Select
                      value={formData.agentType}
                      onValueChange={(val) => handleSelectChange("agentType", val)}
                      required
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="code">Code Based Agent</SelectItem>
                        <SelectItem value="markdown">Markdown Based Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <FileText size={16} />
                      Description
                    </Label>

                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe what this agent does..."
                      className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label>Tags</Label>

                    <Input
                      name="tags"
                      placeholder="support, coding, finance"
                      value={formData.tags}
                      onChange={handleChange}
                    />

                    <p className="text-xs text-muted-foreground">
                      Comma separated tags
                    </p>
                  </div>
                </div>

<div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                  >
                    {loading
                      ? "Registering Agent..."
                      : "Register Agent"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={setShowDialog}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Agent Created Successfully
            </DialogTitle>

            <DialogDescription>
              Add the tracing/monitoring settings to your
              agent code.
            </DialogDescription>
          </DialogHeader>

          {createdAgent && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="space-y-2">
                  <p>
                    <strong>Agent ID:</strong>{" "}
                    {createdAgent.id}
                  </p>

                  <p>
                    <strong>Agent Name:</strong>{" "}
                    {createdAgent.agentName}
                  </p>

                  <p>
                    <strong>Version:</strong>{" "}
                    {createdAgent.version}
                  </p>

                  <p>
                    <strong>Provider:</strong>{" "}
                    {createdAgent.provider}
                  </p>

                  <p>
                    <strong>Model:</strong>{" "}
                    {createdAgent.model}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <Label>
                    Monitoring Configuration
                  </Label>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyConfig}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {createdAgent?.agentType === "markdown" ? "Copy String" : "Copy JSON"}
                      </>
                    )}
                  </Button>
                </div>

                <pre className="rounded-lg border bg-muted p-4 overflow-auto text-sm max-h-48 whitespace-pre-wrap break-all">
{createdAgent?.agentType === "markdown" ? markdownPreview : jsonPreview}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
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

  const copyConfig = async () => {
    if (!createdAgent) return;

    const config = {
      agentName: createdAgent.agentName,
      version: createdAgent.version,
      provider: createdAgent.provider,
      model: createdAgent.model,
    };

    await navigator.clipboard.writeText(
      JSON.stringify(config, null, 2)
    );

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
          result.message || "Failed to create agent"
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
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const jsonPreview = createdAgent
    ? JSON.stringify(
        {
          agentName: createdAgent.agentName,
          version: createdAgent.version,
          provider: createdAgent.provider,
          model: createdAgent.model,
        },
        null,
        2
      )
    : "";

  return (
    <>
      <div className="min-h-screen bg-muted/30 p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Create AI Agent
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

                    <Input
                      name="provider"
                      placeholder="OpenAI"
                      value={formData.provider}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Cpu size={16} />
                      Model
                    </Label>

                    <Input
                      name="model"
                      placeholder="gpt-5"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
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

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Configuration Preview
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Agent Name
                        </p>
                        <p>{formData.agentName || "-"}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Version
                        </p>
                        <p>{formData.version || "-"}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Provider
                        </p>
                        <p>{formData.provider || "-"}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Model
                        </p>
                        <p>{formData.model || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                  >
                    {loading
                      ? "Creating Agent..."
                      : "Create Agent"}
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
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>

                <pre className="rounded-lg border bg-muted p-4 overflow-auto text-sm">
{jsonPreview}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
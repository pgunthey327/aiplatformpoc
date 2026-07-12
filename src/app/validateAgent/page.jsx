"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Circle, FlaskConical, RotateCcw, DatabaseZap } from "lucide-react";

function compareOutputs(actual, expected) {
  if (!expected?.text || !actual) return null;
  const a = actual.toLowerCase();
  // Compare against first 120 chars of expected as a fingerprint
  const fingerprint = expected.text.toLowerCase().slice(0, 120);
  return a.includes(fingerprint) ? "pass" : "fail";
}

function StatusIcon({ status }) {
  if (status === "pass")    return <CheckCircle size={16} className="text-green-500 shrink-0" />;
  if (status === "fail")    return <XCircle size={16} className="text-red-500 shrink-0" />;
  if (status === "running") return <Spinner className="w-4 h-4 shrink-0" />;
  if (status === "error")   return <XCircle size={16} className="text-orange-500 shrink-0" />;
  return <Circle size={16} className="text-muted-foreground shrink-0" />;
}

function StatusBadge({ status }) {
  if (status === "pass")    return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Pass</Badge>;
  if (status === "fail")    return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Fail</Badge>;
  if (status === "running") return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Running…</Badge>;
  if (status === "error")   return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">Error</Badge>;
  if (status === "unsupported") return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Not supported</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

export default function Page() {
  const [agents, setAgents] = useState({});
  const [selectedKey, setSelectedKey] = useState("");
  const [dataset, setDataset] = useState(null);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState("");

  const [runName, setRunName] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({});  // { [itemId]: { status, output, error } }
  const [settingBaseline, setSettingBaseline] = useState({});  // { [itemId]: bool }

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then((r) => setAgents(r.data || {}));
  }, []);

  const agentKeys = Object.keys(agents);
  const selectedAgent = agents[selectedKey] ?? null;

  const defaultRunName = () => {
    if (!selectedAgent) return "";
    const d = new Date().toISOString().slice(0, 10);
    return `${selectedAgent.agentName}-v${selectedAgent.version}-${d}`;
  };

  const handleAgentSelect = (key) => {
    setSelectedKey(key);
    setDataset(null);
    setDatasetError("");
    setResults({});
    const agent = agents[key];
    if (agent) {
      const d = new Date().toISOString().slice(0, 10);
      setRunName(`${agent.agentName}-v${agent.version}-${d}`);
    }
  };

  const loadDataset = async () => {
    if (!selectedAgent) return;
    setDatasetLoading(true);
    setDatasetError("");
    setDataset(null);
    setResults({});
    try {
      const res = await fetch(`/api/datasets?agentName=${encodeURIComponent(selectedAgent.agentName)}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setDataset(result.data);
    } catch (err) {
      setDatasetError(err.message);
    } finally {
      setDatasetLoading(false);
    }
  };

  const runRegression = async () => {
    if (!dataset?.items?.length || !selectedAgent) return;
    setRunning(true);

    // Mark all as pending first
    const initial = {};
    dataset.items.forEach((item) => { initial[item.id] = { status: "pending" }; });
    setResults(initial);

    const effectiveRunName = runName || defaultRunName();

    for (const item of dataset.items) {
      setResults((prev) => ({ ...prev, [item.id]: { status: "running" } }));

      try {
        const res = await fetch("/api/datasets/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentName: selectedAgent.agentName,
            version: selectedAgent.version,
            agentId: selectedAgent.id,
            itemId: item.id,
            prompt: item.input?.prompt ?? "",
            model: selectedAgent.model,
            provider: selectedAgent.provider,
            runName: effectiveRunName,
          }),
        });

        const result = await res.json();

        if (result.unsupported) {
          setResults((prev) => ({
            ...prev,
            [item.id]: { status: "unsupported", error: result.message },
          }));
          // All items will be the same for unsupported provider — break early
          dataset.items.forEach((i) => {
            if (i.id !== item.id) {
              setResults((prev) => ({ ...prev, [i.id]: { status: "unsupported", error: result.message } }));
            }
          });
          break;
        }

        if (!result.success) {
          setResults((prev) => ({
            ...prev,
            [item.id]: { status: "error", error: result.message },
          }));
          continue;
        }

        const comparison = compareOutputs(result.output, item.expectedOutput);
        setResults((prev) => ({
          ...prev,
          [item.id]: {
            status: comparison ?? "done",
            output: result.output,
            traceId: result.traceId,
          },
        }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [item.id]: { status: "error", error: err.message },
        }));
      }
    }

    setRunning(false);
  };

  const setBaseline = async (item) => {
    const actualOutput = results[item.id]?.output;
    if (!actualOutput) return;

    setSettingBaseline((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent.agentName,
          mode: "setBaseline",
          itemId: item.id,
          itemInput: item.input,
          expectedOutput: actualOutput,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      // Update local dataset items to reflect the new expected output
      setDataset((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, expectedOutput: { text: actualOutput } } : i
        ),
      }));

      // Re-evaluate status for this item now that baseline is set
      setResults((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: "pass" },
      }));
    } catch (err) {
      alert(`Failed to set baseline: ${err.message}`);
    } finally {
      setSettingBaseline((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Summary stats
  const resultValues = Object.values(results);
  const passCount  = resultValues.filter((r) => r.status === "pass").length;
  const failCount  = resultValues.filter((r) => r.status === "fail").length;
  const errorCount = resultValues.filter((r) => r.status === "error").length;
  const doneCount  = resultValues.filter((r) => ["pass", "fail", "done", "error", "unsupported"].includes(r.status)).length;
  const hasRun     = doneCount > 0;

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FlaskConical size={28} className="text-primary" />
            Agent Regression Testing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Run your agent&apos;s seeded dataset through its model and detect behavioural regressions over time.
          </p>
        </div>

        {/* Agent selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent (name · version)</Label>
                <Select value={selectedKey} onValueChange={handleAgentSelect}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a registered agent" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {agentKeys.map((key) => {
                      const a = agents[key];
                      return (
                        <SelectItem key={key} value={key}>
                          {a.agentName} · v{a.version}
                          <span className="ml-2 text-xs text-muted-foreground">({a.provider} / {a.model})</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={loadDataset} disabled={!selectedKey || datasetLoading}>
              {datasetLoading ? <Spinner className="w-4 h-4 mr-2" /> : <DatabaseZap size={15} className="mr-2" />}
              Load Dataset
            </Button>

            {datasetError && (
              <p className="text-sm text-destructive">{datasetError}</p>
            )}
          </CardContent>
        </Card>

        {/* Dataset loaded */}
        {dataset !== null && !datasetLoading && (
          <>
            {dataset === null || !dataset?.items?.length ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <DatabaseZap size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No dataset found for this agent.</p>
                  <p className="text-sm mt-1">
                    Add prompts when registering the agent to automatically seed a regression dataset.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Run controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>
                        Dataset: <code className="text-primary text-sm">{dataset.name}</code>
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({dataset.items.length} item{dataset.items.length !== 1 ? "s" : ""})
                        </span>
                      </span>
                      {hasRun && (
                        <div className="flex gap-3 text-sm font-normal">
                          <span className="text-green-400">{passCount} passed</span>
                          <span className="text-red-400">{failCount} failed</span>
                          {errorCount > 0 && <span className="text-orange-400">{errorCount} errored</span>}
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1 flex-1 min-w-48">
                      <Label className="text-xs">Experiment Run Name</Label>
                      <Input
                        value={runName}
                        onChange={(e) => setRunName(e.target.value)}
                        placeholder={defaultRunName()}
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      onClick={runRegression}
                      disabled={running}
                      className="gap-2"
                    >
                      {running
                        ? <><Spinner className="w-4 h-4" /> Running…</>
                        : <><RotateCcw size={15} /> Run Regression</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results table */}
                <div className="space-y-3">
                  {dataset.items.map((item, idx) => {
                    const result  = results[item.id] ?? {};
                    const hasExpected = !!item.expectedOutput?.text;
                    const hasActual   = !!result.output;
                    const canSetBaseline = hasActual && !["running", "pending"].includes(result.status);

                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-5 space-y-4">
                          {/* Item header */}
                          <div className="flex items-start gap-3">
                            <StatusIcon status={result.status} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  Item #{idx + 1}
                                </span>
                                <StatusBadge status={result.status} />
                                {result.traceId && (
                                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                                    trace: {result.traceId.slice(0, 8)}…
                                  </span>
                                )}
                              </div>
                              {result.error && (
                                <p className="text-xs text-orange-400 mt-1">{result.error}</p>
                              )}
                            </div>
                            {canSetBaseline && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={settingBaseline[item.id]}
                                onClick={() => setBaseline(item)}
                                className="shrink-0 text-xs h-7"
                              >
                                {settingBaseline[item.id] ? "Saving…" : hasExpected ? "Update Baseline" : "Set as Baseline"}
                              </Button>
                            )}
                          </div>

                          {/* Input / Output comparison */}
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            {/* Input */}
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input Prompt</p>
                              <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/60 p-3 text-xs leading-relaxed min-h-14">
                                {item.input?.prompt ?? "-"}
                              </pre>
                            </div>

                            {/* Expected */}
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Expected Output
                                {!hasExpected && <span className="ml-1 text-muted-foreground/50 normal-case">(no baseline)</span>}
                              </p>
                              <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/60 p-3 text-xs leading-relaxed min-h-14">
                                {item.expectedOutput?.text
                                  ? item.expectedOutput.text.slice(0, 300) + (item.expectedOutput.text.length > 300 ? "…" : "")
                                  : <span className="italic text-muted-foreground/50">Run once and set baseline to populate this.</span>}
                              </pre>
                            </div>

                            {/* Actual */}
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Actual Output</p>
                              <pre className={`whitespace-pre-wrap break-words rounded-md p-3 text-xs leading-relaxed min-h-14 ${
                                result.status === "pass" ? "bg-green-950/30 border border-green-700/30" :
                                result.status === "fail" ? "bg-red-950/30 border border-red-700/30" :
                                "bg-muted/60"
                              }`}>
                                {result.output
                                  ? result.output.slice(0, 300) + (result.output.length > 300 ? "…" : "")
                                  : result.status === "running"
                                    ? <span className="italic text-muted-foreground/50">Running…</span>
                                    : <span className="italic text-muted-foreground/50">Not yet run.</span>}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Run summary */}
                {hasRun && !running && (
                  <Card className="border-border/60">
                    <CardContent className="pt-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{dataset.items.length}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total Items</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">{passCount}</p>
                          <p className="text-xs text-muted-foreground mt-1">Passed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-400">{failCount}</p>
                          <p className="text-xs text-muted-foreground mt-1">Failed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {dataset.items.length > 0 && (passCount + failCount) > 0
                              ? `${Math.round((passCount / (passCount + failCount)) * 100)}%`
                              : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Pass Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Empty dataset case (data is null = no dataset at all) */}
        {dataset === null && !datasetLoading && selectedKey && !datasetError && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <DatabaseZap size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No dataset found for this agent.</p>
              <p className="text-sm mt-1">
                Add prompts when registering the agent to automatically seed a regression dataset.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

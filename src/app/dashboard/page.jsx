"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { AppSidebar } from "@/components/app-sidebar";
import { TableTemplate } from "@/components/TableTemplate";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Pure helper — outside component so useMemo closures are always stable
function getFieldValue(trace, field) {
  let meta = trace.metadata;
  if (typeof meta === "string") {
    try { meta = JSON.parse(meta); } catch { meta = {}; }
  }
  switch (field) {
    case "input":    return trace.input ?? "";
    case "output":   return trace.output ?? "";
    case "model":    return meta?.model ?? "";
    case "provider": return meta?.provider ?? "";
    default:         return trace[field] ?? "";
  }
}

// Chart colour palette — matches the oklch theme values
const CHART_COLORS = ["#5b8fc9", "#5fada1", "#6aad6a", "#b8953a", "#a0649a"];

const TOOLTIP_STYLE = {
  backgroundColor: "#354055",
  border: "1px solid #4a5568",
  color: "#e8ecf0",
  borderRadius: "6px",
  fontSize: "12px",
};

const AXIS_STYLE = { fill: "#8b9bb4", fontSize: 11 };

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState({});
  const [agentName, setAgentName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agentVersion, setAgentVersion] = useState("");
  const [showSelector, setShowSelector] = useState(true);
  const [activeTab, setActiveTab] = useState("agent");
  const [agentSource, setAgentSource] = useState("registered");
  const [externalAgentName, setExternalAgentName] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "timestamp", direction: "desc" });
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    const loadAgents = async () => {
      const res = await fetch("/api/agents");
      const result = await res.json();
      setAgents(result.data || {});
    };
    loadAgents();
  }, []);

  const fetchFilteredTraces = async () => {
    if (agentSource === "registered" && !agentName) return;
    if (agentSource === "external" && !externalAgentName.trim()) return;
    setLoading(true);
    try {
      let params;
      if (agentSource === "external") {
        params = new URLSearchParams({ metadataAgentName: externalAgentName.trim() });
      } else {
        params = new URLSearchParams({ agentName });
        if (agentId) params.set("agentId", agentId);
        if (agentVersion) params.set("version", agentVersion);
      }
      const res = await fetch(`/api/getTraces?${params.toString()}`);
      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally { setLoading(false); }
  };

  const fetchAllTraces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/getTraces");
      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally { setLoading(false); }
  };

  const handleAgentSourceChange = (source) => {
    setAgentSource(source);
    setAgentName(""); setAgentId(""); setAgentVersion(""); setExternalAgentName("");
  };

  const handleReset = () => {
    setAgentName(""); setAgentId(""); setAgentVersion("");
    setExternalAgentName(""); setAgentSource("registered");
    setTraces([]); setShowSelector(true); setActiveTab("agent");
  };

  const addFilter    = (f)  => setFilters((p) => [...p, f]);
  const removeFilter = (i)  => setFilters((p) => p.filter((_, idx) => idx !== i));
  const clearFilters = ()   => setFilters([]);
  const handleSort   = (field) => setSortConfig((p) => ({
    field,
    direction: p.field === field && p.direction === "asc" ? "desc" : "asc",
  }));

  // Agent names filtered by agentType
  const codeAgentNames = [...new Set(
    Object.values(agents).filter((a) => a.agentType !== "markdown").map((a) => a.agentName)
  )];
  const markdownAgentNames = [...new Set(
    Object.values(agents).filter((a) => a.agentType === "markdown").map((a) => a.agentName)
  )];

  const agentNames = agentSource === "external" ? markdownAgentNames : codeAgentNames;
  const agentIds   = [...new Set(
    Object.keys(agents).filter((k) => k.split("|")[0] === agentName).map((k) => k.split("|")[1])
  )];
  const versions   = [...new Set(
    Object.keys(agents)
      .filter((k) => { const [n, id] = k.split("|"); return n === agentName && (agentId ? id === agentId : true); })
      .map((k) => k.split("|")[2])
  )];

  // Filtered + sorted traces for the table
  const filteredAndSortedTraces = useMemo(() => {
    let data = [...traces];
    for (const f of filters) {
      data = data.filter((trace) => {
        const cell = String(getFieldValue(trace, f.field)).toLowerCase().trim();
        const val  = f.value.toLowerCase().trim();
        switch (f.operator) {
          case "contains":    return cell.includes(val);
          case "notContains": return !cell.includes(val);
          case "equals":      return cell === val;
          case "notEquals":   return cell !== val;
          default:            return true;
        }
      });
    }
    data.sort((a, b) => {
      const aVal = getFieldValue(a, sortConfig.field);
      const bVal = getFieldValue(b, sortConfig.field);
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
    return data;
  }, [traces, sortConfig, filters]);

  // Aggregated data for charts — derived from the same filtered set
  const { modelData, providerData } = useMemo(() => {
    const byModel    = {};
    const byProvider = {};

    for (const trace of filteredAndSortedTraces) {
      let meta = trace.metadata;
      if (typeof meta === "string") { try { meta = JSON.parse(meta); } catch { meta = {}; } }

      const model    = meta?.model    || "Unknown";
      const provider = meta?.provider || "Unknown";

      if (!byModel[model]) {
        byModel[model] = { name: model, traces: 0, cost: 0, latencySum: 0, latencyCount: 0, inputTokens: 0, outputTokens: 0 };
      }
      byModel[model].traces++;
      byModel[model].cost         += trace.totalCost || 0;
      if (trace.latency) { byModel[model].latencySum += trace.latency; byModel[model].latencyCount++; }
      byModel[model].inputTokens  += meta?.inputTokens  || 0;
      byModel[model].outputTokens += meta?.outputTokens || 0;

      if (!byProvider[provider]) byProvider[provider] = { name: provider, traces: 0, cost: 0 };
      byProvider[provider].traces++;
      byProvider[provider].cost += trace.totalCost || 0;
    }

    const modelData = Object.values(byModel).map((m) => ({
      ...m,
      cost:       +m.cost.toFixed(6),
      avgLatency: m.latencyCount ? +(m.latencySum / m.latencyCount).toFixed(2) : 0,
    }));
    const providerData = Object.values(byProvider).map((p) => ({
      ...p,
      cost: +p.cost.toFixed(6),
    }));

    return { modelData, providerData };
  }, [filteredAndSortedTraces]);

  const totalCost = providerData.reduce((s, p) => s + p.cost, 0).toFixed(6);

  const tabs = [
    { id: "agent",  label: "Agent Metrics" },
    { id: "model",  label: "Model & Provider" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar filters={filters} addFilter={addFilter} removeFilter={removeFilter} clearFilters={clearFilters} />

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-card/90 backdrop-blur-md px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />

          {/* Tabs */}
          {!showSelector && (
            <div className="flex items-center gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <span className="flex-1 text-sm text-muted-foreground">
            {!showSelector && `${filteredAndSortedTraces.length} trace${filteredAndSortedTraces.length !== 1 ? "s" : ""}`}
          </span>

          {!showSelector && (
            <Button variant="outline" size="sm" onClick={handleReset}>Change Filter</Button>
          )}
        </header>

        {/* Agent selector */}
        {showSelector && (
          <div className="p-4">
            <Card>
              <CardHeader><CardTitle>Select Agent</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Source toggle */}
                <div className="flex gap-1 rounded-md border p-1 w-fit">
                  {[
                    { id: "registered", label: "Code Based Agent" },
                    { id: "external",   label: "Markdown Based Agent" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAgentSourceChange(s.id)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        agentSource === s.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {agentSource === "registered" ? (
                  <>
                    <Select value={agentName} onValueChange={(v) => { setAgentName(v); setAgentId(""); setAgentVersion(""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Code Based Agent" /></SelectTrigger>
                      <SelectContent position="popper">
                        {agentNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <Select value={externalAgentName} onValueChange={setExternalAgentName}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Markdown Based Agent" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {agentNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={fetchFilteredTraces}
                    disabled={agentSource === "registered" ? !agentName : !externalAgentName}
                  >
                    Load Traces
                  </Button>
                  <Button variant="outline" onClick={fetchAllTraces}>Show All</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="flex justify-center p-10"><Spinner /></div>}

        {/* ── Agent Metrics tab ── */}
        {!loading && !showSelector && activeTab === "agent" && (
          <TableTemplate data={filteredAndSortedTraces} sortConfig={sortConfig} onSort={handleSort} />
        )}

        {/* ── Model & Provider tab ── */}
        {!loading && !showSelector && activeTab === "model" && (
          <div className="p-5 space-y-6">

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Traces"     value={filteredAndSortedTraces.length} />
              <StatCard label="Unique Models"    value={modelData.length} />
              <StatCard label="Unique Providers" value={providerData.length} />
              <StatCard label="Total Cost"       value={`$${totalCost}`} />
            </div>

            {/* Row 1: Provider pie + Traces by model bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Card>
                <CardHeader><CardTitle className="text-sm">Traces by Provider</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={providerData} dataKey="traces" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {providerData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#8b9bb4" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Traces by Model</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                        <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Bar dataKey="traces" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Traces" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Cost by model + Token usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Card>
                <CardHeader><CardTitle className="text-sm">Total Cost by Model ($)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                        <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [`$${v}`, "Cost"]} />
                        <Bar dataKey="cost" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Token Usage by Model</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                        <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#8b9bb4" }} />
                        <Bar dataKey="inputTokens"  stackId="t" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} name="Input Tokens" />
                        <Bar dataKey="outputTokens" stackId="t" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} name="Output Tokens" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Avg Latency */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Average Latency by Model (ms)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [`${v} ms`, "Avg Latency"]} />
                      <Bar dataKey="avgLatency" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} name="Avg Latency (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

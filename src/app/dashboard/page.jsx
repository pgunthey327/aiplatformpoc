"use client";

import { useEffect, useMemo, useState } from "react";

// Pure helper — defined outside component so useMemo closure is always stable
function getFieldValue(trace, field) {
  // metadata may arrive as a JSON string from some Langfuse API versions
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
import { AppSidebar } from "@/components/app-sidebar";
import { TableTemplate } from "@/components/TableTemplate";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState({});

  const [agentName, setAgentName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agentVersion, setAgentVersion] = useState("");

  const [showSelector, setShowSelector] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    field: "timestamp",
    direction: "desc",
  });

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
    if (!agentName) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ agentName });
      if (agentId) params.set("agentId", agentId);
      if (agentVersion) params.set("version", agentVersion);

      const res = await fetch(`/api/getTraces?${params.toString()}`);
      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTraces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/getTraces");
      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAgentName("");
    setAgentId("");
    setAgentVersion("");
    setTraces([]);
    setShowSelector(true);
  };

  const addFilter = (filter) => setFilters((prev) => [...prev, filter]);
  const removeFilter = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));
  const clearFilters = () => setFilters([]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Derived cascading options
  const agentNames = [...new Set(Object.keys(agents).map((k) => k.split("|")[0]))];

  const agentIds = [
    ...new Set(
      Object.keys(agents)
        .filter((k) => k.split("|")[0] === agentName)
        .map((k) => k.split("|")[1])
    ),
  ];

  const versions = [
    ...new Set(
      Object.keys(agents)
        .filter((k) => {
          const [name, id] = k.split("|");
          return name === agentName && (agentId ? id === agentId : true);
        })
        .map((k) => k.split("|")[2])
    ),
  ];

  const filteredAndSortedTraces = useMemo(() => {
    let data = [...traces];

    // Apply sidebar filters
    for (const f of filters) {
      data = data.filter((trace) => {
        const cell = String(getFieldValue(trace, f.field)).toLowerCase().trim();
        const val = f.value.toLowerCase().trim();
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
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [traces, sortConfig, filters]);

  return (
    <SidebarProvider>
      <AppSidebar
        filters={filters}
        addFilter={addFilter}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />

      <SidebarInset>
        <header className="sticky top-0 flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" />
          <span className="flex-1">Metrics</span>
          {!showSelector && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Change Filter
            </Button>
          )}
        </header>

        {/* Filter selector */}
        {showSelector && (
          <div className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Agent</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <Select
                  value={agentName}
                  onValueChange={(val) => {
                    setAgentName(val);
                    setAgentId("");
                    setAgentVersion("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Agent Name" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {agentNames.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={agentId}
                  onValueChange={(val) => {
                    setAgentId(val);
                    setAgentVersion("");
                  }}
                  disabled={!agentName || agentIds.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Agent ID (optional)" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {agentIds.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={agentVersion}
                  onValueChange={setAgentVersion}
                  disabled={!agentName || versions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Version (optional)" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {versions.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button onClick={fetchFilteredTraces} disabled={!agentName}>
                    Load Traces
                  </Button>
                  <Button variant="outline" onClick={fetchAllTraces}>
                    Show All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        )}

        {/* Table — only after selector is dismissed */}
        {!loading && !showSelector && (
          <TableTemplate
            data={filteredAndSortedTraces}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

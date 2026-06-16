"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function Page() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(false); // 🔥 FIXED (was true)
  
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

  // ---------------- LOAD AGENTS ONLY ----------------
  useEffect(() => {
    const loadAgents = async () => {
      const res = await fetch("/api/agents");
      const result = await res.json();
      setAgents(result.data || {});
    };

    loadAgents();
  }, []);

  // ---------------- FETCH FUNCTIONS (ONLY WHEN USER ACTS) ----------------

  const fetchFilteredTraces = async () => {
    if (!agentName || !agentId || !agentVersion) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/getTraces?agentName=${agentName}&agentId=${agentId}&version=${agentVersion}`
      );

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

  // ---------------- DERIVED ----------------

  const agentNames = [
    ...new Set(Object.keys(agents).map((k) => k.split("|")[0])),
  ];

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
          return name === agentName && id === agentId;
        })
        .map((k) => k.split("|")[2])
    ),
  ];

  // ---------------- EXISTING LOGIC (UNCHANGED) ----------------

  const getFieldValue = (trace, field) => {
    switch (field) {
      case "input":
        return trace.input ?? "";
      case "output":
        return trace.output ?? "";
      case "model":
        return trace.metadata?.model ?? "";
      case "provider":
        return trace.metadata?.provider ?? "";
      default:
        return trace[field];
    }
  };

  const filteredAndSortedTraces = useMemo(() => {
    let data = [...traces];

    data.sort((a, b) => {
      const aValue = getFieldValue(a, sortConfig.field);
      const bValue = getFieldValue(b, sortConfig.field);

      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === "asc"
        ? aValue - bValue
        : bValue - aValue;
    });

    return data;
  }, [traces, sortConfig]);

  // ---------------- UI ACTIONS ----------------

  const handleLoad = () => {
    fetchFilteredTraces();
  };

  const handleSkip = () => {
    fetchAllTraces();
  };

  return (
    <SidebarProvider>
      <AppSidebar filters={filters} />

      <SidebarInset>
        <header className="sticky top-0 flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" />
          Metrics
        </header>

        {/* ---------------- SELECTOR ---------------- */}
        {showSelector && (
          <div className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Agent</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <select
                  className="border p-2 w-full rounded"
                  value={agentName}
                  onChange={(e) => {
                    setAgentName(e.target.value);
                    setAgentId("");
                    setAgentVersion("");
                  }}
                >
                  <option value="">Agent Name</option>
                  {agentNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>

                <select
                  className="border p-2 w-full rounded"
                  value={agentId}
                  onChange={(e) => {
                    setAgentId(e.target.value);
                    setAgentVersion("");
                  }}
                >
                  <option value="">Agent ID</option>
                  {agentIds.map((id) => (
                    <option key={id}>{id}</option>
                  ))}
                </select>

                <select
                  className="border p-2 w-full rounded"
                  value={agentVersion}
                  onChange={(e) =>
                    setAgentVersion(e.target.value)
                  }
                >
                  <option value="">Version</option>
                  {versions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <Button onClick={handleLoad}>
                    Load Traces
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------------- LOADING ---------------- */}
        {loading && (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        )}

        {/* ---------------- TABLE ---------------- */}
        {!loading && (
          <TableTemplate data={filteredAndSortedTraces} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
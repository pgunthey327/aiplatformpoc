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
import { Spinner } from "@/components/ui/spinner"
export default function Page() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    field: "timestamp",
    direction: "desc",
  });

  const [filters, setFilters] = useState([
    // Example:
    // {
    //   field: "provider",
    //   operator: "equals",
    //   value: "ollama",
    // }
  ]);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/getTraces");
        const result = await res.json();

        setTraces(result.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false)
      }
    };

    getData();
  }, []);

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

      case "inputTokens":
        return trace.metadata?.inputTokens ?? 0;

      case "outputTokens":
        return trace.metadata?.outputTokens ?? 0;

      case "totalTokens":
        return trace.metadata?.totalTokens ?? 0;

      default:
        return trace[field];
    }
  };

  const matchesFilter = (trace, filter) => {
    const source = String(
      getFieldValue(trace, filter.field) ?? ""
    ).toLowerCase();

    const target = String(filter.value ?? "").toLowerCase();

    switch (filter.operator) {
      case "contains":
        return source.includes(target);

      case "notContains":
        return !source.includes(target);

      case "equals":
        return source === target;

      case "notEquals":
        return source !== target;

      default:
        return true;
    }
  };

  const filteredAndSortedTraces = useMemo(() => {
    let data = [...traces];

    if (filters.length > 0) {
      data = data.filter((trace) =>
        filters.every((filter) => matchesFilter(trace, filter))
      );
    }

    data.sort((a, b) => {
      const aValue = getFieldValue(a, sortConfig.field);
      const bValue = getFieldValue(b, sortConfig.field);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

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
  }, [traces, filters, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const addFilter = (filter) => {
    setFilters((prev) => [...prev, filter]);
  };

  const removeFilter = (index) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        filters={filters}
        addFilter={addFilter}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />

      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Metrics
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {loading && <div className="w-full h-full flex justify-center items-center"> <Spinner /></div>}
        {!loading && <div>
          <TableTemplate
            data={filteredAndSortedTraces}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>
        }
      </SidebarInset>
    </SidebarProvider>
  );
}
"use client"

import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

// This is sample data.
const data = {
  versions: ["1.0.0", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
    },
    {
      title: "Build Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Contribution Guide",
          url: "#",
        },
      ],
    },
  ],
}
const tempSideBar = {
  versions: ["1.0.0", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Filter 1"
    },
    {
      title: "Filter 2"
    },
    {
      title: "Filter 3"
    },
    {
      title: "Filter 4"
    },
    {
      title: "Filter 5"
    },
  ],
}

export function AppSidebar({
  filters,
  addFilter,
  removeFilter,
  clearFilters,
  ...props
}) {
  const [field, setField] = useState("input");
  const [operator, setOperator] = useState("contains");
  const [value, setValue] = useState("");
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
        {/* <span>LangFuse Dashboard</span> */}
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="p-4">
        <div className="space-y-4">

          <div>
            <h3 className="font-semibold mb-2">Field</h3>

            <Select
              value={field}
              onValueChange={setField}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="input">Prompt</SelectItem>
                <SelectItem value="output">Response</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Operator</h3>

            <Select
              value={operator}
              onValueChange={setOperator}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="contains">
                  Contains
                </SelectItem>

                <SelectItem value="notContains">
                  Not Contains
                </SelectItem>

                <SelectItem value="equals">
                  Equals
                </SelectItem>

                <SelectItem value="notEquals">
                  Not Equals
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Value</h3>

            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => {
              if (!value.trim()) return;

              addFilter({
                field,
                operator,
                value,
              });

              setValue("");
            }}
          >
            Add Filter
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">
              Active Filters
            </h3>

            <div className="space-y-2">
              {filters.map((filter, index) => (
                <div
                  key={index}
                  className="border rounded-md p-2 text-sm"
                >
                  <div>
                    <strong>{filter.field}</strong>
                  </div>

                  <div>{filter.operator}</div>

                  <div>"{filter.value}"</div>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="mt-2 w-full"
                    onClick={() => removeFilter(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {filters.length === 0 && (
                <div className="text-muted-foreground text-sm">
                  No filters applied
                </div>
              )}
            </div>
          </div>

        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>

  );
}

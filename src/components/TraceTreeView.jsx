"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const TYPE_STYLES = {
  LLM:        "bg-blue-900/40 text-blue-300 border-blue-600/40",
  GENERATION: "bg-blue-900/40 text-blue-300 border-blue-600/40",
  SPAN:       "bg-green-900/40 text-green-300 border-green-600/40",
  EVENT:      "bg-orange-900/40 text-orange-300 border-orange-600/40",
};
const DEFAULT_STYLE = "bg-zinc-800/60 text-zinc-300 border-zinc-600/40";

function durationLabel(obs) {
  if (obs.latency != null) return `${(obs.latency * 1000).toFixed(0)} ms`;
  if (obs.startTime && obs.endTime) {
    const ms = new Date(obs.endTime) - new Date(obs.startTime);
    return `${ms.toFixed(0)} ms`;
  }
  return null;
}

function buildTree(observations) {
  const map = {};
  observations.forEach((o) => { map[o.id] = { ...o, children: [] }; });
  const roots = [];
  observations.forEach((o) => {
    if (o.parentObservationId && map[o.parentObservationId]) {
      map[o.parentObservationId].children.push(map[o.id]);
    } else {
      roots.push(map[o.id]);
    }
  });
  Object.values(map).forEach((n) =>
    n.children.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  );
  return roots;
}

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const style = TYPE_STYLES[node.type] || DEFAULT_STYLE;
  const dur = durationLabel(node);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 rounded hover:bg-muted/60 cursor-pointer group"
        style={{ paddingLeft: `${depth * 18 + 8}px`, paddingRight: "8px" }}
        onClick={() => hasChildren && setOpen((v) => !v)}
      >
        <span className="w-4 shrink-0 text-muted-foreground">
          {hasChildren
            ? open
              ? <ChevronDown size={13} />
              : <ChevronRight size={13} />
            : <span className="w-[13px] block" />}
        </span>

        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style}`}>
          {node.type ?? "?"}
        </span>

        <span className="text-sm font-medium truncate flex-1 text-foreground">
          {node.name}
        </span>

        {dur && (
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{dur}</span>
        )}
      </div>

      {hasChildren && open && (
        <div className="border-l border-border/40 ml-[21px]">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TraceTreeView({ observations = [] }) {
  const roots = buildTree(observations);

  if (roots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 italic">
        No observation hierarchy available for this trace.
      </p>
    );
  }

  return (
    <div className="space-y-0.5 font-mono text-xs">
      {roots.map((root) => (
        <TreeNode key={root.id} node={root} depth={0} />
      ))}
    </div>
  );
}

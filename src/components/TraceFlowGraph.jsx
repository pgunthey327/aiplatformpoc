"use client";

const NODE_W = 190;
const NODE_H = 58;
const H_GAP  = 50;
const V_GAP  = 72;
const PAD    = 24;

const TYPE_FILL = {
  LLM:        "#0f2744",
  GENERATION: "#0f2744",
  SPAN:       "#0f2e1a",
  EVENT:      "#2e1a05",
};
const TYPE_STROKE = {
  LLM:        "#5b8fc9",
  GENERATION: "#5b8fc9",
  SPAN:       "#6aad6a",
  EVENT:      "#b8953a",
};
const DEFAULT_FILL   = "#1c1c2a";
const DEFAULT_STROKE = "#6b7280";

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
  return { roots, map };
}

function layoutNodes(roots) {
  const positions = {};
  let leafIdx = 0;

  function assignDepth(node, depth) {
    node._depth = depth;
    node.children.forEach((c) => assignDepth(c, depth + 1));
  }

  function assignX(node) {
    if (node.children.length === 0) {
      positions[node.id] = {
        x: leafIdx * (NODE_W + H_GAP),
        y: node._depth * (NODE_H + V_GAP),
      };
      leafIdx++;
      return positions[node.id].x + NODE_W / 2;
    }
    const centerXs = node.children.map(assignX);
    const cx = (centerXs[0] + centerXs[centerXs.length - 1]) / 2;
    positions[node.id] = {
      x: cx - NODE_W / 2,
      y: node._depth * (NODE_H + V_GAP),
    };
    return cx;
  }

  roots.forEach((r) => assignDepth(r, 0));
  roots.forEach((r) => assignX(r));
  return positions;
}

function durationLabel(obs) {
  if (obs.latency != null) return `${(obs.latency * 1000).toFixed(0)} ms`;
  if (obs.startTime && obs.endTime) {
    return `${(new Date(obs.endTime) - new Date(obs.startTime)).toFixed(0)} ms`;
  }
  return null;
}

export function TraceFlowGraph({ observations = [] }) {
  if (observations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 italic">
        No graph data available for this trace.
      </p>
    );
  }

  const { roots, map } = buildTree(observations);
  const positions = layoutNodes(roots);

  const allNodes = Object.values(map);
  const edges = allNodes
    .filter((n) => n.parentObservationId && positions[n.parentObservationId])
    .map((n) => ({ from: n.parentObservationId, to: n.id }));

  const xs = Object.values(positions).map((p) => p.x);
  const ys = Object.values(positions).map((p) => p.y);
  const svgW = (xs.length ? Math.max(...xs) + NODE_W : NODE_W) + PAD * 2;
  const svgH = (ys.length ? Math.max(...ys) + NODE_H : NODE_H) + PAD * 2;

  return (
    <div className="overflow-auto rounded-md border border-border/40 bg-card p-2">
      <svg width={svgW} height={svgH} style={{ display: "block" }}>
        <defs>
          <marker id="tfg-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill={DEFAULT_STROKE} />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map(({ from, to }) => {
          const fp = positions[from];
          const tp = positions[to];
          if (!fp || !tp) return null;
          const x1 = fp.x + PAD + NODE_W / 2;
          const y1 = fp.y + PAD + NODE_H;
          const x2 = tp.x + PAD + NODE_W / 2;
          const y2 = tp.y + PAD;
          const my = (y1 + y2) / 2;
          return (
            <path
              key={`${from}-${to}`}
              d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
              fill="none"
              stroke={DEFAULT_STROKE}
              strokeWidth="1.5"
              markerEnd="url(#tfg-arrow)"
            />
          );
        })}

        {/* Nodes */}
        {allNodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;
          const nx = pos.x + PAD;
          const ny = pos.y + PAD;
          const fill   = TYPE_FILL[node.type]   ?? DEFAULT_FILL;
          const stroke = TYPE_STROKE[node.type] ?? DEFAULT_STROKE;
          const label  = node.name?.length > 22 ? node.name.slice(0, 20) + "…" : node.name ?? "";
          const dur    = durationLabel(node);

          return (
            <g key={node.id}>
              <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={7}
                fill={fill} stroke={stroke} strokeWidth={1.5} />

              {/* type pill */}
              <text x={nx + NODE_W / 2} y={ny + 15}
                textAnchor="middle" fill={stroke} fontSize={9} fontWeight="700"
                letterSpacing="0.08em">
                {node.type ?? "?"}
              </text>

              {/* name */}
              <text x={nx + NODE_W / 2} y={ny + 32}
                textAnchor="middle" fill="#e8ecf0" fontSize={11}>
                {label}
              </text>

              {/* duration */}
              {dur && (
                <text x={nx + NODE_W / 2} y={ny + 48}
                  textAnchor="middle" fill="#8b9bb4" fontSize={9}>
                  {dur}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

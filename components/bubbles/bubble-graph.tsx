"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { Bubble, Relationship } from "@/types/database";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const TYPE_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
const DIMMED_COLOR = "rgba(140, 140, 140, 0.2)";

function colorForType(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = (hash << 5) - hash + type.charCodeAt(i);
    hash |= 0;
  }
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length];
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

interface GraphLink {
  source: string;
  target: string;
  relationship_type: string;
}

export function BubbleGraph({
  bubbles,
  relationships,
  highlightedIds,
}: {
  bubbles: Bubble[];
  relationships: Relationship[];
  highlightedIds?: string[] | null;
}) {
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const graphData = useMemo(
    () => ({
      nodes: bubbles.map(
        (b): GraphNode => ({
          id: b.id,
          name: b.label,
          type: b.type,
          description: b.description,
        }),
      ),
      links: relationships.map(
        (r): GraphLink => ({
          source: r.source_bubble_id,
          target: r.target_bubble_id,
          relationship_type: r.relationship_type,
        }),
      ),
    }),
    [bubbles, relationships],
  );

  const highlightSet = useMemo(
    () => (highlightedIds ? new Set(highlightedIds) : null),
    [highlightedIds],
  );

  if (bubbles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
          Your universe is empty
        </p>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          Bubbles will appear here as you capture thoughts. Bubbl organizes
          them automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeLabel="name"
        nodeColor={(node) => {
          const n = node as unknown as GraphNode;
          const base = colorForType(n.type);
          if (!highlightSet) return base;
          return highlightSet.has(n.id) ? base : DIMMED_COLOR;
        }}
        linkColor={(link) => {
          if (!highlightSet) return "rgba(255,255,255,0.2)";
          const l = link as unknown as { source: string | GraphNode; target: string | GraphNode };
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          return highlightSet.has(sourceId) && highlightSet.has(targetId)
            ? "rgba(255,255,255,0.4)"
            : "rgba(140,140,140,0.08)";
        }}
        linkLabel={(link) => (link as unknown as GraphLink).relationship_type}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => setSelected(node as unknown as GraphNode)}
        onBackgroundClick={() => setSelected(null)}
      />

      {selected && (
        <div className="absolute bottom-6 left-6 max-w-xs rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {selected.type}
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950 dark:text-white">
            {selected.name}
          </p>
          {selected.description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {selected.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { Bubble, Relationship } from "@/types/database";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

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
}: {
  bubbles: Bubble[];
  relationships: Relationship[];
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
        nodeAutoColorBy="type"
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

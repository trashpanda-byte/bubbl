"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Bubble, Relationship } from "@/types/database";

import { BubbleGraph } from "./bubble-graph";
import { BubbleSearch } from "./bubble-search";
import { ThoughtCapture } from "./thought-capture";

export function UniverseView({
  bubbles,
  relationships,
}: {
  bubbles: Bubble[];
  relationships: Relationship[];
}) {
  const router = useRouter();
  const [highlightedIds, setHighlightedIds] = useState<string[] | null>(null);

  return (
    <div className="relative h-full w-full">
      <ThoughtCapture />
      <BubbleSearch onResults={setHighlightedIds} />
      <BubbleGraph
        bubbles={bubbles}
        relationships={relationships}
        highlightedIds={highlightedIds}
        onBubbleChanged={() => router.refresh()}
      />
    </div>
  );
}

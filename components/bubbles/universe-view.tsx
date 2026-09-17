"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Bubble, Relationship } from "@/types/database";

import { BubbleGraph } from "./bubble-graph";
import { BubbleGraph3D } from "./bubble-graph-3d";
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
  const [mode, setMode] = useState<"3d" | "2d">("3d");

  const handleBubbleChanged = () => router.refresh();

  return (
    <div className="relative h-full w-full bg-[#040611]">
      <ThoughtCapture />
      <BubbleSearch onResults={setHighlightedIds} />

      <button
        type="button"
        onClick={() => setMode(mode === "3d" ? "2d" : "3d")}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur transition hover:bg-white/10"
      >
        {mode === "3d" ? "Switch to 2D" : "Switch to 3D"}
      </button>

      {mode === "3d" ? (
        <BubbleGraph3D
          bubbles={bubbles}
          relationships={relationships}
          highlightedIds={highlightedIds}
          onBubbleChanged={handleBubbleChanged}
        />
      ) : (
        <BubbleGraph
          bubbles={bubbles}
          relationships={relationships}
          highlightedIds={highlightedIds}
          onBubbleChanged={handleBubbleChanged}
        />
      )}
    </div>
  );
}

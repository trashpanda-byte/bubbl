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
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleBubbleChanged = () => router.refresh();
  const linkingFromLabel = bubbles.find((b) => b.id === linkingFromId)?.label ?? null;

  async function handleLinkTargetSelected(targetBubbleId: string) {
    if (!linkingFromId || targetBubbleId === linkingFromId) return;
    setLinkError(null);

    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceBubbleId: linkingFromId, targetBubbleId }),
    });

    setLinkingFromId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLinkError(body?.error ?? "Couldn't create that link.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="relative h-full w-full bg-[#040611]">
      <ThoughtCapture />
      <BubbleSearch onResults={setHighlightedIds} />

      {linkingFromId && (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-sky-400/30 bg-sky-950/90 px-4 py-2 text-xs font-medium text-sky-200 shadow-lg backdrop-blur">
          Linking &ldquo;{linkingFromLabel}&rdquo; — select another bubble{" "}
          <button
            type="button"
            onClick={() => setLinkingFromId(null)}
            className="ml-2 underline underline-offset-2 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
      {linkError && (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-red-400/30 bg-red-950/90 px-4 py-2 text-xs font-medium text-red-200 shadow-lg backdrop-blur">
          {linkError}
        </div>
      )}

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
          linkingFromId={linkingFromId}
          onStartLinking={setLinkingFromId}
          onLinkTargetSelected={handleLinkTargetSelected}
        />
      ) : (
        <BubbleGraph
          bubbles={bubbles}
          relationships={relationships}
          highlightedIds={highlightedIds}
          onBubbleChanged={handleBubbleChanged}
          linkingFromId={linkingFromId}
          onStartLinking={setLinkingFromId}
          onLinkTargetSelected={handleLinkTargetSelected}
        />
      )}
    </div>
  );
}

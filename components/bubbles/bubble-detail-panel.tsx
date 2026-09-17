"use client";

import { useState } from "react";

export interface DetailBubble {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

export function BubbleDetailPanel({
  bubble,
  onClose,
  onChanged,
  onStartLinking,
}: {
  bubble: DetailBubble;
  onClose: () => void;
  onChanged: () => void;
  onStartLinking: (bubbleId: string) => void;
}) {
  const [label, setLabel] = useState(bubble.name);
  const [type, setType] = useState(bubble.type);
  const [description, setDescription] = useState(bubble.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const dirty =
    label !== bubble.name || type !== bubble.type || description !== (bubble.description ?? "");

  async function handleSave() {
    if (!label.trim() || saving) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/bubbles/${bubble.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        type: type.trim(),
        description: description.trim() || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't save that change.");
      return;
    }

    setSavedJustNow(true);
    onChanged();
  }

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(`Delete "${bubble.name}"? This can't be undone.`)) return;

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/bubbles/${bubble.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't delete that bubble.");
      return;
    }

    onChanged();
    onClose();
  }

  return (
    <div className="absolute bottom-6 left-6 z-10 w-full max-w-sm rounded-xl border border-white/10 bg-[#0a0e1f]/95 p-4 shadow-lg shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-1/2 bg-transparent text-xs font-medium uppercase tracking-wide text-neutral-500 outline-none focus:text-neutral-300"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-500 transition hover:text-neutral-200"
        >
          Close
        </button>
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add notes, details, anything you want stored here…"
        rows={4}
        className="mt-2 w-full resize-none rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-sm text-neutral-300 outline-none focus:border-white/20"
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={() => onStartLinking(bubble.id)}
        className="mt-3 text-xs font-medium text-sky-400 transition hover:text-sky-300"
      >
        Link to another bubble…
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <div className="flex items-center gap-2">
          {savedJustNow && !dirty && (
            <span className="text-xs text-emerald-400">Saved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || !label.trim()}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

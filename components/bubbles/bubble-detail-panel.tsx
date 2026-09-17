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
}: {
  bubble: DetailBubble;
  onClose: () => void;
  onChanged: () => void;
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
    <div className="absolute bottom-6 left-6 z-10 w-full max-w-sm rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="flex items-start justify-between gap-2">
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-1/2 bg-transparent text-xs font-medium uppercase tracking-wide text-neutral-400 outline-none focus:text-neutral-600 dark:focus:text-neutral-300"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          Close
        </button>
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-neutral-950 outline-none dark:text-white"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add notes, details, anything you want stored here…"
        rows={4}
        className="mt-2 w-full resize-none rounded-lg border border-transparent bg-neutral-100 px-2 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:focus:border-neutral-600"
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-red-500 transition hover:text-red-600 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <div className="flex items-center gap-2">
          {savedJustNow && !dirty && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || !label.trim()}
            className="rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

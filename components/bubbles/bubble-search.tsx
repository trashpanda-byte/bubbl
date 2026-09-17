"use client";

import { useState } from "react";

export function BubbleSearch({
  onResults,
}: {
  onResults: (ids: string[] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    setLoading(false);

    if (!res.ok) return;

    const data: { results: { id: string }[] } = await res.json();
    setActive(true);
    onResults(data.results.map((r) => r.id));
  }

  function handleClear() {
    setQuery("");
    setActive(false);
    onResults(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute right-4 top-6 z-10 w-full max-w-xs px-4 sm:px-0"
    >
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your universe…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
        {active ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-xs font-medium text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            Clear
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-neutral-950 disabled:opacity-50 dark:hover:text-white"
          >
            {loading ? "…" : "Search"}
          </button>
        )}
      </div>
    </form>
  );
}

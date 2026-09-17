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
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-lg shadow-black/40 backdrop-blur">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your universe…"
          className="flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        {active ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            Clear
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 text-xs font-medium text-neutral-400 transition hover:text-white disabled:opacity-50"
          >
            {loading ? "…" : "Search"}
          </button>
        )}
      </div>
    </form>
  );
}

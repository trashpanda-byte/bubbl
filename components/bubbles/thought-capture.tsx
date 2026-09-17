"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ThoughtCapture() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/thoughts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setText("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute left-1/2 top-6 z-10 w-full max-w-xl -translate-x-1/2 px-4"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-lg shadow-black/40 backdrop-blur">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  updatedBubbles?: { id: string; label: string }[];
}

export function AssistantChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError(null);

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, conversationId }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    const data: {
      conversationId: string;
      answer: string;
      updatedBubbles?: { id: string; label: string }[];
    } = await res.json();
    setConversationId(data.conversationId);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer, updatedBubbles: data.updatedBubbles },
    ]);
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4 py-6">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-neutral-500">
            Ask something like &ldquo;What are my current goals?&rdquo; — I&rsquo;ll answer
            using what&rsquo;s actually in your universe.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-white text-neutral-950"
                  : "bg-white/10 text-neutral-100"
              }`}
            >
              {m.content}
              {m.updatedBubbles && m.updatedBubbles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                  {m.updatedBubbles.map((b) => (
                    <span
                      key={b.id}
                      className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-400"
                    >
                      Updated: {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-neutral-400">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your goals, tasks, ideas…"
          className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-white/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

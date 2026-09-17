import { NextResponse } from "next/server";
import { z } from "zod";

import { embedText } from "@/lib/ai";
import { matchBubbles } from "@/lib/db/bubbles";
import { createClient } from "@/lib/supabase/server";

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
});

// Below this, results are usually unrelated noise rather than a real match —
// tune if real usage shows it's too strict/loose.
const SIMILARITY_THRESHOLD = 0.3;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ q: searchParams.get("q") });
  if (!parsed.success) {
    return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  }

  try {
    const queryEmbedding = await embedText(parsed.data.q, "query");
    const results = await matchBubbles(supabase, queryEmbedding, 10);
    const relevant = results.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);
    return NextResponse.json({ results: relevant });
  } catch (err) {
    console.error("Search failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}

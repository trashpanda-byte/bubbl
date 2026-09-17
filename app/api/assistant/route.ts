import { NextResponse } from "next/server";
import { z } from "zod";

import { answerQuestion, embedText } from "@/lib/ai";
import { getRelationshipsAmongBubbles, matchBubbles } from "@/lib/db/bubbles";
import { getOrCreateConversation, insertMessage } from "@/lib/db/conversations";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const conversation = await getOrCreateConversation(
    supabase,
    user.id,
    parsed.data.conversationId ?? null,
  );

  await insertMessage(supabase, {
    conversation_id: conversation.id,
    user_id: user.id,
    role: "user",
    content: parsed.data.message,
  });

  try {
    const queryEmbedding = await embedText(parsed.data.message, "query");
    const bubbles = await matchBubbles(supabase, queryEmbedding, 8);
    const bubbleIds = new Set(bubbles.map((b) => b.id));
    const labelById = new Map(bubbles.map((b) => [b.id, b.label]));

    const rawRelationships = await getRelationshipsAmongBubbles(
      supabase,
      Array.from(bubbleIds),
    );
    const relationships = rawRelationships
      .filter((r) => bubbleIds.has(r.source_bubble_id) && bubbleIds.has(r.target_bubble_id))
      .map((r) => ({
        sourceLabel: labelById.get(r.source_bubble_id) ?? "",
        targetLabel: labelById.get(r.target_bubble_id) ?? "",
        relationshipType: r.relationship_type,
      }));

    const answer = await answerQuestion(parsed.data.message, { bubbles, relationships });

    await insertMessage(supabase, {
      conversation_id: conversation.id,
      user_id: user.id,
      role: "assistant",
      content: answer,
      retrieved_bubble_ids: bubbles.map((b) => b.id),
    });

    return NextResponse.json({
      conversationId: conversation.id,
      answer,
      retrievedBubbleIds: bubbles.map((b) => b.id),
    });
  } catch (err) {
    console.error("Assistant failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong answering that." }, { status: 500 });
  }
}

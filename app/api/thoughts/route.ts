import { NextResponse } from "next/server";
import { z } from "zod";

import { extractBubblesFromThought } from "@/lib/ai";
import { getBubblesForCurrentUser, insertBubble } from "@/lib/db/bubbles";
import { insertRelationship } from "@/lib/db/relationships";
import { insertThought, updateThoughtStatus } from "@/lib/db/thoughts";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  text: z.string().trim().min(1).max(4000),
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
    return NextResponse.json({ error: "Thought text is required." }, { status: 400 });
  }

  const thought = await insertThought(supabase, user.id, parsed.data.text);

  try {
    const existingBubbles = await getBubblesForCurrentUser(supabase);
    const candidates = existingBubbles.map((b) => ({ id: b.id, label: b.label, type: b.type }));
    const knownIds = new Set(candidates.map((c) => c.id));

    const extraction = await extractBubblesFromThought(parsed.data.text, candidates);

    const tempIdToBubbleId = new Map<string, string>();
    let newBubbleCount = 0;

    for (const entity of extraction.entities) {
      if (
        entity.action === "reuse" &&
        entity.existingBubbleId &&
        knownIds.has(entity.existingBubbleId)
      ) {
        tempIdToBubbleId.set(entity.tempId, entity.existingBubbleId);
        continue;
      }

      const bubble = await insertBubble(supabase, {
        user_id: user.id,
        label: entity.label,
        type: entity.type,
        description: entity.description,
        source_thought_id: thought.id,
      });
      tempIdToBubbleId.set(entity.tempId, bubble.id);
      newBubbleCount += 1;
    }

    for (const rel of extraction.relationships) {
      const sourceId = tempIdToBubbleId.get(rel.sourceTempId);
      const targetId = tempIdToBubbleId.get(rel.targetTempId);
      if (!sourceId || !targetId || sourceId === targetId) continue;

      await insertRelationship(supabase, {
        user_id: user.id,
        source_bubble_id: sourceId,
        target_bubble_id: targetId,
        relationship_type: rel.relationshipType,
        confidence: rel.confidence,
        source_thought_id: thought.id,
      });
    }

    await updateThoughtStatus(supabase, thought.id, "processed");

    return NextResponse.json({ thoughtId: thought.id, newBubbleCount });
  } catch (err) {
    await updateThoughtStatus(supabase, thought.id, "failed");
    console.error("Thought processing failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong processing that thought." },
      { status: 500 },
    );
  }
}

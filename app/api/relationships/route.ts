import { NextResponse } from "next/server";
import { z } from "zod";

import { countOwnedBubbles, insertRelationship } from "@/lib/db/relationships";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z
  .object({
    sourceBubbleId: z.string().uuid(),
    targetBubbleId: z.string().uuid(),
    relationshipType: z.string().trim().min(1).max(100).default("related_to"),
  })
  .refine((data) => data.sourceBubbleId !== data.targetBubbleId, {
    message: "A bubble can't be linked to itself.",
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { sourceBubbleId, targetBubbleId, relationshipType } = parsed.data;

  try {
    // RLS already scopes this select to the caller's own bubbles, so
    // getting back fewer than 2 rows means one of the ids isn't real or
    // isn't theirs — never trust client-supplied ids for a write like this.
    const ownedCount = await countOwnedBubbles(supabase, [sourceBubbleId, targetBubbleId]);
    if (ownedCount !== 2) {
      return NextResponse.json({ error: "Bubble not found." }, { status: 404 });
    }

    await insertRelationship(supabase, {
      user_id: user.id,
      source_bubble_id: sourceBubbleId,
      target_bubble_id: targetBubbleId,
      relationship_type: relationshipType,
      confidence: 1,
      source_thought_id: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Manual link failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not create that link." }, { status: 500 });
  }
}

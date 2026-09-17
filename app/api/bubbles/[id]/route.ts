import { NextResponse } from "next/server";
import { z } from "zod";

import { embedText } from "@/lib/ai";
import { deleteBubble, updateBubble } from "@/lib/db/bubbles";
import { createClient } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  try {
    const values: Parameters<typeof updateBubble>[2] = { ...parsed.data };

    // Re-embed so search/assistant retrieval reflects the edited content.
    if (parsed.data.label !== undefined || parsed.data.description !== undefined) {
      const label = parsed.data.label ?? "";
      const description = parsed.data.description;
      const text = description ? `${label}: ${description}` : label;
      if (text.trim()) {
        values.embedding = await embedText(text, "document");
      }
    }

    const bubble = await updateBubble(supabase, id, values);
    return NextResponse.json({ bubble });
  } catch (err) {
    console.error("Bubble update failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not update that bubble." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    await deleteBubble(supabase, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bubble delete failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not delete that bubble." }, { status: 404 });
  }
}

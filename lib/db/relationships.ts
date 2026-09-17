import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function insertRelationship(
  supabase: SupabaseServerClient,
  values: {
    user_id: string;
    source_bubble_id: string;
    target_bubble_id: string;
    relationship_type: string;
    confidence: number | null;
    source_thought_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("relationships").insert(values);
  if (error) throw error;
}

export async function countOwnedBubbles(
  supabase: SupabaseServerClient,
  bubbleIds: string[],
): Promise<number> {
  const { count, error } = await supabase
    .from("bubbles")
    .select("id", { count: "exact", head: true })
    .in("id", bubbleIds);
  if (error) throw error;
  return count ?? 0;
}

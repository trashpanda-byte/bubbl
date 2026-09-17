import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function insertRelationship(
  supabase: SupabaseServerClient,
  values: {
    user_id: string;
    source_bubble_id: string;
    target_bubble_id: string;
    relationship_type: string;
    confidence: number;
    source_thought_id: string;
  },
): Promise<void> {
  const { error } = await supabase.from("relationships").insert(values);
  if (error) throw error;
}

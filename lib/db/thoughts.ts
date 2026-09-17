import { createClient } from "@/lib/supabase/server";
import type { Thought, ThoughtStatus } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function insertThought(
  supabase: SupabaseServerClient,
  userId: string,
  rawText: string,
): Promise<Thought> {
  const { data, error } = await supabase
    .from("thoughts")
    .insert({ user_id: userId, raw_text: rawText })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateThoughtStatus(
  supabase: SupabaseServerClient,
  thoughtId: string,
  status: ThoughtStatus,
): Promise<void> {
  const { error } = await supabase.from("thoughts").update({ status }).eq("id", thoughtId);
  if (error) throw error;
}

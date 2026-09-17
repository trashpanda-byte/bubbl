import { createClient } from "@/lib/supabase/server";
import type { Bubble, Relationship } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getBubblesForCurrentUser(
  supabase?: SupabaseServerClient,
): Promise<Bubble[]> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("bubbles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRelationshipsForCurrentUser(
  supabase?: SupabaseServerClient,
): Promise<Relationship[]> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client.from("relationships").select("*");

  if (error) throw error;
  return data;
}

export async function insertBubble(
  supabase: SupabaseServerClient,
  values: {
    user_id: string;
    label: string;
    type: string;
    description: string | null;
    source_thought_id: string;
  },
): Promise<Bubble> {
  const { data, error } = await supabase.from("bubbles").insert(values).select().single();
  if (error) throw error;
  return data;
}

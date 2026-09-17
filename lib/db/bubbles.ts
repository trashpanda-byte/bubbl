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
    embedding?: number[] | null;
  },
): Promise<Bubble> {
  const { data, error } = await supabase.from("bubbles").insert(values).select().single();
  if (error) throw error;
  return data;
}

export interface BubbleMatch {
  id: string;
  label: string;
  type: string;
  description: string | null;
  similarity: number;
}

export async function matchBubbles(
  supabase: SupabaseServerClient,
  queryEmbedding: number[],
  matchCount = 8,
): Promise<BubbleMatch[]> {
  const { data, error } = await supabase.rpc("match_bubbles", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) throw error;
  return data;
}

export async function getRelationshipsAmongBubbles(
  supabase: SupabaseServerClient,
  bubbleIds: string[],
): Promise<Relationship[]> {
  if (bubbleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .or(
      `source_bubble_id.in.(${bubbleIds.join(",")}),target_bubble_id.in.(${bubbleIds.join(",")})`,
    );

  if (error) throw error;
  return data;
}

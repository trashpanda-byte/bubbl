import { createClient } from "@/lib/supabase/server";
import type { Bubble, Relationship } from "@/types/database";

export async function getBubblesForCurrentUser(): Promise<Bubble[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bubbles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRelationshipsForCurrentUser(): Promise<Relationship[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("relationships")
    .select("*");

  if (error) throw error;
  return data;
}

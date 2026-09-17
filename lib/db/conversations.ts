import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message, MessageRole } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getOrCreateConversation(
  supabase: SupabaseServerClient,
  userId: string,
  conversationId: string | null,
): Promise<Conversation> {
  if (conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessagesForConversation(
  supabase: SupabaseServerClient,
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function insertMessage(
  supabase: SupabaseServerClient,
  values: {
    conversation_id: string;
    user_id: string;
    role: MessageRole;
    content: string;
    retrieved_bubble_ids?: string[];
  },
): Promise<Message> {
  const { data, error } = await supabase.from("messages").insert(values).select().single();
  if (error) throw error;
  return data;
}

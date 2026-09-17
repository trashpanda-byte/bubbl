// Hand-written to match supabase/migrations/20260917000000_initial_schema.sql.
// If the schema drifts from this file, regenerate with the Supabase CLI:
// `supabase gen types typescript --project-id jjetjxrvlqwrteellghx`
//
// Every table includes an empty `Relationships: []`, and the schema includes
// empty `Views`/`Functions`, purely because @supabase/postgrest-js's generic
// types require those shapes to be present to infer Row/Insert/Update
// correctly — this is what `supabase gen types` itself always outputs.

export type ThoughtStatus = "pending" | "processed" | "failed";
export type MessageRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      thoughts: {
        Row: {
          id: string;
          user_id: string;
          raw_text: string;
          status: ThoughtStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          raw_text: string;
          status?: ThoughtStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          raw_text?: string;
          status?: ThoughtStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      bubbles: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          type: string;
          description: string | null;
          metadata: Record<string, unknown>;
          embedding: number[] | null;
          source_thought_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          type: string;
          description?: string | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          source_thought_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          type?: string;
          description?: string | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          source_thought_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      relationships: {
        Row: {
          id: string;
          user_id: string;
          source_bubble_id: string;
          target_bubble_id: string;
          relationship_type: string;
          confidence: number | null;
          source_thought_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_bubble_id: string;
          target_bubble_id: string;
          relationship_type: string;
          confidence?: number | null;
          source_thought_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_bubble_id?: string;
          target_bubble_id?: string;
          relationship_type?: string;
          confidence?: number | null;
          source_thought_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          retrieved_bubble_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          retrieved_bubble_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          retrieved_bubble_ids?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_bubbles: {
        Args: { query_embedding: number[]; match_count?: number };
        Returns: {
          id: string;
          label: string;
          type: string;
          description: string | null;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Bubble = Database["public"]["Tables"]["bubbles"]["Row"];
export type Relationship = Database["public"]["Tables"]["relationships"]["Row"];
export type Thought = Database["public"]["Tables"]["thoughts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

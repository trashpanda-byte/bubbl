-- Bubbl.ai initial schema
-- Tables: profiles, thoughts, bubbles, relationships, conversations, messages
-- Every table has RLS enabled, scoped to the owning user.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- profiles
-- One row per authenticated user. id matches auth.users.id directly.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_access"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- thoughts
-- Raw free-text captures from "What's on your mind?" before AI processing.
-- ---------------------------------------------------------------------------
create table public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  raw_text text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.thoughts enable row level security;

create policy "thoughts_owner_access"
  on public.thoughts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index thoughts_user_id_idx on public.thoughts (user_id);

-- ---------------------------------------------------------------------------
-- bubbles
-- The core node in the bubble graph. `type` is free text set by the AI, not
-- a fixed enum. `metadata` holds type-specific extra fields.
-- `embedding` is used for semantic (natural-language) search via pgvector.
-- Dimension 1536 matches common embedding models (e.g. OpenAI
-- text-embedding-3-small); revisit via a follow-up migration if a different
-- embedding provider/model is chosen later.
-- ---------------------------------------------------------------------------
create table public.bubbles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  source_thought_id uuid references public.thoughts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bubbles enable row level security;

create policy "bubbles_owner_access"
  on public.bubbles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index bubbles_user_id_idx on public.bubbles (user_id);
create index bubbles_user_id_type_idx on public.bubbles (user_id, type);
create index bubbles_embedding_idx on public.bubbles
  using hnsw (embedding vector_cosine_ops);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bubbles_set_updated_at
  before update on public.bubbles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- relationships
-- Typed, directed edges between two bubbles belonging to the same user.
-- ---------------------------------------------------------------------------
create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_bubble_id uuid not null references public.bubbles (id) on delete cascade,
  target_bubble_id uuid not null references public.bubbles (id) on delete cascade,
  relationship_type text not null,
  confidence real,
  source_thought_id uuid references public.thoughts (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint relationships_no_self_link check (source_bubble_id <> target_bubble_id)
);

alter table public.relationships enable row level security;

create policy "relationships_owner_access"
  on public.relationships
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index relationships_user_id_idx on public.relationships (user_id);
create index relationships_source_bubble_id_idx on public.relationships (source_bubble_id);
create index relationships_target_bubble_id_idx on public.relationships (target_bubble_id);

-- ---------------------------------------------------------------------------
-- conversations
-- A thread of messages with the AI assistant.
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "conversations_owner_access"
  on public.conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index conversations_user_id_idx on public.conversations (user_id);

-- ---------------------------------------------------------------------------
-- messages
-- Individual turns within a conversation. `user_id` is denormalized from the
-- parent conversation so RLS can check it directly without a join.
-- `retrieved_bubble_ids` records which bubbles were used to ground an
-- assistant answer (for retrieval, never the full database).
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  retrieved_bubble_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_owner_access"
  on public.messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index messages_conversation_id_idx on public.messages (conversation_id);
create index messages_user_id_idx on public.messages (user_id);

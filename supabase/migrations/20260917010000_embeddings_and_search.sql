-- Switches bubbles.embedding to match Voyage AI's voyage-4 model (1024
-- dimensions by default) and adds a similarity-search function for
-- semantic retrieval. The column has no data yet, so this is a plain
-- type change rather than a data migration.

drop index if exists public.bubbles_embedding_idx;

alter table public.bubbles
  alter column embedding type vector(1024);

create index bubbles_embedding_idx on public.bubbles
  using hnsw (embedding vector_cosine_ops);

-- Runs with the caller's own permissions (not security definer), so Row
-- Level Security on bubbles still restricts results to the caller's own
-- rows — this is what lets the app hand the AI assistant and search a
-- short, relevant list instead of ever reading the whole table.
create or replace function public.match_bubbles(
  query_embedding vector(1024),
  match_count int default 8
)
returns table (
  id uuid,
  label text,
  type text,
  description text,
  similarity float
)
language sql
stable
as $$
  select
    bubbles.id,
    bubbles.label,
    bubbles.type,
    bubbles.description,
    1 - (bubbles.embedding <=> query_embedding) as similarity
  from public.bubbles
  where bubbles.embedding is not null
  order by bubbles.embedding <=> query_embedding
  limit match_count;
$$;

# Bubbl.ai — Project Brief

You are the lead software architect and senior full-stack engineer for a product called Bubbl.ai. The product owner is not an experienced programmer — explain important technical decisions in plain English, but don't overwhelm with unnecessary detail. Ask before major architectural decisions with long-term consequences; use judgment on small stuff.

## Product Vision

Bubbl.ai is an AI-powered "second brain" / visual life-organization app. Users dump thoughts, ideas, goals, plans, questions into Bubbl. The AI interprets that input and organizes it into a dynamic network of interconnected "bubbles" (a thought, topic, goal, project, task, person, place, piece of knowledge, decision, interest, document, or life area). The user should NOT have to manually organize anything — "You think. Bubbl organizes." The long-term vision includes a 3D bubble universe and webcam/gesture navigation, but NEITHER is part of the MVP — don't build them yet.

## First MVP Scope

1. Landing page — polished, core message "Your mind, visualized." No exaggerated medical/psychological/productivity claims.
2. Auth via Supabase — signup, login, logout, private workspace per user.
3. Bubble Universe — after login, a 2D interactive bubble graph (pan, zoom, select, open, create, edit, delete bubbles, view relationships, navigate between connected bubbles). Architect the data model so a 3D view can be added later without rebuilding it.
4. Thought Capture — a simple "What's on your mind?" input. AI extracts concepts/entities from free text.
5. AI categorization — AI determines entity types, matches against existing bubbles (reuse, don't duplicate), decides if a new bubble is needed, determines relationships, classifies the thought (goal/task/idea/question/etc).
6. Relationships — typed/semantic connections between bubbles (e.g. "related_to", "part_of", "supports", "affects"). Keep the model simple now but extensible.
7. AI assistant — user can ask questions like "What are my current goals?" and get answers grounded in their actual stored data via retrieval/search — NEVER by dumping the whole database into the AI prompt.
8. Natural-language search across the user's bubbles/thoughts.

## Architecture (already decided — follow this, don't re-litigate unless something is genuinely broken)

- Next.js (App Router) + React + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security) for data and accounts
- AI: Anthropic Claude, behind a thin provider-agnostic abstraction layer (app code calls generic functions like `extractBubblesFromThought(text)`, never the Anthropic SDK directly) so another provider could be added later without touching the rest of the app
- All AI output must be structured and schema-validated (Zod) before it's ever written to the database — never trust raw AI output for database mutations
- Bubble visualization: react-force-graph (2D now — react-force-graph-2d). This family also has a 3D version built on Three.js sharing the same data format, which is why it was picked — easy 3D upgrade path later.
- Deployment target: Vercel (not set up yet)
- Version control: Git, with descriptive commits at each milestone. GitHub repo: https://github.com/trashpanda-byte/bubbl

## Database Schema

Design principle: bubble "types" are free text set by the AI, not a fixed enum — don't hard-code a category list. Type-specific extra fields live in a flexible `jsonb` column rather than one new table per concept.

- **profiles**: id (matches auth.users id), email, display_name, created_at
- **bubbles**: id, user_id, label, type (text), description, metadata (jsonb), embedding (vector, pgvector — for semantic search), source_thought_id (nullable FK), created_at, updated_at
- **relationships**: id, user_id, source_bubble_id, target_bubble_id, relationship_type (text), confidence (float), source_thought_id (nullable FK), created_at
- **thoughts**: id, user_id, raw_text, status (pending/processed/failed), created_at
- **conversations**: id, user_id, title, created_at
- **messages**: id, conversation_id, role (user/assistant), content, retrieved_bubble_ids (jsonb), created_at

Every table needs a `user_id` column and a Row Level Security policy restricting access to `user_id = auth.uid()`. The pgvector Postgres extension is enabled for the embedding column.

> Implementation note: the `messages` table above didn't originally list a `user_id` column, but the "every table needs user_id + RLS" rule takes precedence, so `user_id` was added to `messages` (denormalized from its parent `conversation`) in the actual migration. See `supabase/migrations/20260917000000_initial_schema.sql`.

## Folder Structure

```
/app/(marketing)
/app/(auth)
/app/(workspace)/universe
/app/api
/components/ui
/components/bubbles
/components/landing
/lib/ai        (provider abstraction + Anthropic adapter + Zod schemas)
/lib/supabase
/lib/db
/types
/supabase/migrations
```

## Minimum Dependencies

`next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `@anthropic-ai/sdk`, `react-force-graph-2d`. No state-management or UI-kit library unless an actual need arises.

## Security Rules (non-negotiable)

- Never put secret API keys or the Supabase service role key in frontend/client code — server-side env vars only
- `.env.local` (gitignored, real values) and `.env.example` (committed, placeholder names only)
- Row Level Security on every table, enforced server-side, never trust a client-supplied user ID
- Don't log private user thought content unnecessarily

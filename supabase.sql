create table if not exists public.steady_states (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.steady_states enable row level security;

-- This app's backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Do not expose the service role key in Vercel or frontend code.

-- ============================================================
-- ORIENTATION COMPLETIONS - the audit record the case file needs
-- Paste into the CDS project's Supabase SQL editor (siivpekcaryeyttszwav).
--
-- 19 CSR 15-8.400(5)(H)5 requires documentation of consumer training
-- in the case file. Until now a finished orientation lived only in the
-- learner's browser. This table receives one row per completion, posted
-- by the public course pages with the same publishable key the site's
-- lead forms already use.
--
-- Same safety pattern as site_leads: the public key can INSERT and
-- nothing else - it cannot read, edit or delete completions.
-- ============================================================

create table if not exists orientation_completions (
  id            uuid primary key default gen_random_uuid(),
  course        text not null check (course in ('consumer','attendant')),
  name          text not null,
  date_signed   text,
  score         int,
  total         int,
  elapsed_min   int,
  acks          boolean,          -- all 7 acknowledgment boxes were checked
  user_agent    text,
  completed_at  timestamptz not null default now()
);

alter table orientation_completions enable row level security;

create policy oc_anon_insert on orientation_completions
  for insert to anon with check (true);
create policy oc_read on orientation_completions
  for select to authenticated using (true);

-- RLS and GRANTs are two separate gates; both are needed
grant insert on orientation_completions to anon;
grant select on orientation_completions to authenticated;

notify pgrst, 'reload schema';

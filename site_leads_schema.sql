-- ============================================================================
-- caringcds.com — website enquiries
--
-- Run this ENTIRE file as ONE query in:
--   https://supabase.com/dashboard/project/siivpekcaryeyttszwav/sql/new
--
-- Every form on the new site writes here, so no enquiry is ever lost even if a
-- GoHighLevel automation fails or a webhook is misconfigured. This is the
-- system of record; GHL is the thing that chases the lead.
--
-- anon gets INSERT only, deliberately. The forms are public, so their key is in
-- the page source. Without SELECT, nobody can read your leads back out of it.
-- ============================================================================

create table if not exists site_leads (
  id              uuid        default gen_random_uuid() primary key,
  agency_id       text        not null,
  source          text,        -- which page / form it came from
  first_name      text,
  last_name       text,
  full_name       text,        -- the shorter forms ask for one name field
  phone           text,
  email           text,
  county          text,
  who_needs_care  text,        -- self / family member / wants to be the caregiver
  has_medicaid    text,        -- yes / no / not sure
  message         text,
  -- your staff own these
  status          text        default 'new',   -- new | contacted | enrolled | not eligible | lost
  staff_notes     text,
  last_contacted  date,
  archived        boolean     default false,
  submitted_at    timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists site_leads_agency_idx on site_leads (agency_id);
create index if not exists site_leads_status_idx on site_leads (status);

create or replace function site_leads_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_leads_touch_trg on site_leads;
create trigger site_leads_touch_trg
  before update on site_leads
  for each row execute function site_leads_touch();

alter table site_leads enable row level security;

drop policy if exists "public_insert_site_leads" on site_leads;
create policy "public_insert_site_leads"
  on site_leads for insert to anon with check (true);

drop policy if exists "auth_read_site_leads" on site_leads;
create policy "auth_read_site_leads"
  on site_leads for select to authenticated using (true);

drop policy if exists "auth_update_site_leads" on site_leads;
create policy "auth_update_site_leads"
  on site_leads for update to authenticated using (true);

drop policy if exists "auth_delete_site_leads" on site_leads;
create policy "auth_delete_site_leads"
  on site_leads for delete to authenticated using (true);

-- GRANTs. Separate gate from RLS; skipping these is what broke agency_data.
grant usage on schema public to anon, authenticated, service_role;

grant insert                         on public.site_leads to anon;
grant select, insert, update, delete on public.site_leads to authenticated;
grant all privileges                 on public.site_leads to service_role;

notify pgrst, 'reload schema';

-- Verification. Expect 3 rows: anon = INSERT only.
select grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as can
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name   = 'site_leads'
  and grantee in ('anon', 'authenticated', 'service_role')
group by grantee
order by grantee;

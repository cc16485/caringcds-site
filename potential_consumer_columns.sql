-- ============================================================================
-- A caregiver who already has someone to care for IS A LEAD
--
-- Run this ENTIRE file as ONE query in:
--   https://supabase.com/dashboard/project/siivpekcaryeyttszwav/sql/new
--
-- The single most valuable thing a caregiver can tell us is "I already look
-- after my mother". That is not Candidate List depth, that is a new consumer,
-- a new authorization and billable hours walking in the door. It was previously
-- an optional free-text box most people skipped, so it was invisible.
--
-- These columns capture it, and the webhook now flags it so GoHighLevel can
-- treat those people as leads rather than filing them with everyone else.
-- ============================================================================

alter table attendant_pool add column if not exists has_potential_consumer text;   -- Yes | No | Not sure
alter table attendant_pool add column if not exists consumer_relationship  text;   -- Parent, Grandparent, Friend...
alter table attendant_pool add column if not exists consumer_has_medicaid  text;   -- Yes, active Medicaid | Not sure | No
alter table attendant_pool add column if not exists show_anonymously       boolean default true;

-- Find them fast: this is the query the office will actually care about.
create index if not exists attendant_pool_potential_idx
  on attendant_pool (has_potential_consumer)
  where has_potential_consumer = 'Yes';

-- ── Webhook payload: carry the answers, and pre-compute the decision ────────
-- is_lead is derived here rather than in GoHighLevel so the rule lives in one
-- place. If the rule ever changes, it changes once, here.
create or replace function attendant_pool_to_ghl() returns trigger
language plpgsql security definer as $$
begin
  begin
    perform extensions.net.http_post(
      url     := ghl_webhook_url(),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := jsonb_build_object(
        'record_type',   case when new.has_potential_consumer = 'Yes'
                              then 'caregiver_with_consumer'
                              else 'caregiver_signup' end,
        'is_lead',       (new.has_potential_consumer = 'Yes'),
        'tag',           case when new.has_potential_consumer = 'Yes'
                              then 'CDS Caregiver With Consumer'
                              else 'CDS Candidate List' end,
        'first_name',    new.first_name,
        'last_name',     new.last_name,
        'phone',         new.phone,
        'email',         new.email,
        'city',          new.city,
        'zip',           new.zip,
        'counties',      new.counties,
        'availability',  new.availability,
        'hours_wanted',  new.hours_wanted,
        'experience',    new.experience,
        'cert_cpr',      new.cert_cpr,
        'cert_cna',      new.cert_cna,
        'worked_before', new.worked_here_before,
        -- the part that turns a signup into a lead
        'has_potential_consumer', new.has_potential_consumer,
        'knows_consumer',         new.knows_consumer,
        'consumer_relationship',  new.consumer_relationship,
        'consumer_has_medicaid',  new.consumer_has_medicaid,
        'source',        new.source,
        'supabase_id',   new.id
      )
    );
  exception when others then
    null;   -- a webhook problem must never lose the signup
  end;
  return new;
end;
$$;

notify pgrst, 'reload schema';

-- Verify: expect the four new columns listed.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'attendant_pool'
  and column_name in ('has_potential_consumer','consumer_relationship',
                      'consumer_has_medicaid','show_anonymously','knows_consumer')
order by column_name;

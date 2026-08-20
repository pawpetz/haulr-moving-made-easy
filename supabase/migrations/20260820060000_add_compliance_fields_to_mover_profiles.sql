-- Simplified provider compliance/verification support.
--
-- Full spec (state-by-state rules engine, automated expiration emails,
-- background checks, audit trail, job-matching compliance gate) is
-- deliberately NOT implemented yet — there are no real movers or
-- regulatory exposure to justify that infrastructure right now, and
-- the actual legal requirements need review by transportation/legal
-- counsel before they can be encoded as real rules anyway.
--
-- This is the lightweight version: movers upload license/insurance
-- documents with expiration dates, and an admin manually reviews and
-- approves. mover_profiles already had license_number, license_state,
-- insurance_provider, insurance_policy columns — this adds what was
-- missing (expiry dates, document URLs, and an admin-controlled
-- overall compliance status).
alter table public.mover_profiles
  add column if not exists license_expires_at date,
  add column if not exists insurance_expires_at date,
  add column if not exists license_doc_url text,
  add column if not exists insurance_doc_url text,
  add column if not exists compliance_status text not null default 'PENDING_REVIEW',
  add column if not exists compliance_notes text;

alter table public.mover_profiles
  add constraint mover_profiles_compliance_status_check
  check (compliance_status in ('PENDING_REVIEW', 'APPROVED', 'ACTION_REQUIRED'));

-- Compliance approval must be admin-only, same reasoning as the
-- earlier self-privilege-escalation fix: RLS is row-level, so a
-- column-level protection needs a trigger. Movers can still update
-- their own expiry dates and document URLs when renewing — only the
-- admin's approval decision and notes are protected here.
create or replace function public.prevent_mover_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') or pg_trigger_depth() > 1 then
    return new;
  end if;

  new.status := old.status;
  new.rating := old.rating;
  new.jobs_completed := old.jobs_completed;
  new.total_earnings := old.total_earnings;
  new.license_number := old.license_number;
  new.license_state := old.license_state;
  new.insurance_provider := old.insurance_provider;
  new.insurance_policy := old.insurance_policy;
  new.is_demo := old.is_demo;
  new.compliance_status := old.compliance_status;
  new.compliance_notes := old.compliance_notes;
  return new;
end;
$$;

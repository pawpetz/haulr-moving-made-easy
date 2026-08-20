-- Lightweight background-check status tracking. Movers going into
-- customers' homes makes this a genuine trust/safety requirement, not
-- speculative infrastructure — but actually running a check requires a
-- real provider integration (Checkr, Sterling, etc.) that isn't set up
-- yet. This tracks status/consent and gates approval on it; the
-- provider integration is a follow-up once a real account exists.
alter table public.mover_profiles
  add column if not exists background_check_status text not null default 'NOT_STARTED',
  add column if not exists background_check_consent boolean not null default false,
  add column if not exists background_check_consented_at timestamptz;

alter table public.mover_profiles
  add constraint mover_profiles_background_check_status_check
  check (background_check_status in ('NOT_STARTED', 'PENDING', 'PASSED', 'FAILED'));

-- The pass/fail result is admin-only (same reasoning as compliance_status
-- and every other self-escalation fix this session); consent stays
-- self-editable since the mover authorizing a check is a legitimate
-- part of their own application.
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
  new.background_check_status := old.background_check_status;
  return new;
end;
$$;

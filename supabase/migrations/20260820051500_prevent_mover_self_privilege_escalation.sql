-- The "update own mover profile" RLS policy allows a mover to update
-- their own row with no column-level restriction at all — meaning a
-- mover could directly call the API to set status='APPROVED', inflate
-- their own rating, or fake jobs_completed/total_earnings, completely
-- bypassing admin approval and trust signals. RLS is row-level only,
-- so column protection needs a trigger.
create or replace function public.prevent_mover_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow: admins, nested system-trigger updates (job-completion /
  -- rating stats triggers updating mover_profiles from within their
  -- own trigger execution), and privileged connections with no
  -- request-level JWT at all (auth.uid() is null) such as service-role
  -- or direct database access — those are already outside RLS's trust
  -- boundary.
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') or pg_trigger_depth() > 1 then
    return new;
  end if;

  -- Otherwise this is a direct client-side update from the row owner.
  -- Lock down fields that must never be self-editable.
  new.status := old.status;
  new.rating := old.rating;
  new.jobs_completed := old.jobs_completed;
  new.total_earnings := old.total_earnings;
  new.license_number := old.license_number;
  new.license_state := old.license_state;
  new.insurance_provider := old.insurance_provider;
  new.insurance_policy := old.insurance_policy;
  new.is_demo := old.is_demo;
  return new;
end;
$$;

drop trigger if exists trg_prevent_mover_self_escalation on public.mover_profiles;
create trigger trg_prevent_mover_self_escalation
before update on public.mover_profiles
for each row
execute function public.prevent_mover_self_privilege_escalation();

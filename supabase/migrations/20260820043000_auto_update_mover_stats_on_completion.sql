-- Nothing was updating mover_profiles.jobs_completed or total_earnings
-- when a job's status changed to COMPLETED — the mover dashboard's
-- earnings/completed stats would silently never move. Handle this at
-- the database level (not client code) so it's correct regardless of
-- which client updates the job status.
create or replace function public.handle_job_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' and new.mover_id is not null then
    update public.mover_profiles
    set jobs_completed = jobs_completed + 1,
        total_earnings = total_earnings + coalesce(new.mover_payout, 0)
    where id = new.mover_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_job_completed on public.jobs;
create trigger trg_job_completed
after update of status on public.jobs
for each row
execute function public.handle_job_completed();

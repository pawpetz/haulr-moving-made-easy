-- The mover application form collects a short bio, but there was nowhere
-- to store it — it was silently discarded on submit.
alter table public.mover_profiles add column if not exists bio text;

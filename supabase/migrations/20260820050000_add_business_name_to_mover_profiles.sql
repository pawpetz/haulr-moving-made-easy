-- Movers may operate under a registered business name rather than (or
-- in addition to) their personal name. Optional — falls back to the
-- personal full_name (already collected at signup) when not set.
alter table public.mover_profiles add column if not exists business_name text;

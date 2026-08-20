-- mover_profiles.rating defaults to 5.0 and nothing ever recomputed it —
-- real customer ratings would go into the ratings table but never move
-- the number shown on the mover's own dashboard. Recompute the average
-- whenever a new rating comes in.
create or replace function public.handle_rating_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.mover_id is not null then
    update public.mover_profiles
    set rating = (
      select round(avg(stars)::numeric, 2)
      from public.ratings
      where mover_id = new.mover_id
    )
    where id = new.mover_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rating_created on public.ratings;
create trigger trg_rating_created
after insert on public.ratings
for each row
execute function public.handle_rating_created();

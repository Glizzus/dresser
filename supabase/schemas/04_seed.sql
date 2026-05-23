-- ---------------------------------------------------------------------------
-- Seed every new user automatically: garment categories + the four base-layer
-- piles at both houses (4 kinds x 2 houses = 8 piles, all starting empty).
-- Base layers are NOT categories anymore — they are piles.
--
-- NOTE: this is per-user *application* seeding, fired by the trigger in
-- 05_triggers.sql on auth.users insert. It is NOT the `supabase db reset` seed
-- (that is supabase/seed.sql, which is empty — there is no global seed data).
-- ---------------------------------------------------------------------------

create or replace function public.seed_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (owner, name)
  values
    (new.id, 'Normal Shirts'),
    (new.id, 'Normal Pants'),
    (new.id, 'Church Shirts'),
    (new.id, 'Church Pants'),
    (new.id, 'Pajama Shirts'),
    (new.id, 'Pajama Pants'),
    (new.id, 'Athletic Shirts'),
    (new.id, 'Athletic Shorts')
  on conflict (owner, name) do nothing;

  insert into public.piles (owner, house, kind)
  select new.id, h.house, k.kind
  from (values ('A'), ('B')) as h(house)
  cross join (values ('Underwear'), ('Socks'), ('Undershirts'), ('Tank Tops')) as k(kind)
  on conflict (owner, house, kind) do nothing;

  return new;
end $$;

-- Replaces the older seed function name, if it exists from a prior migration.
drop function if exists public.seed_default_categories();

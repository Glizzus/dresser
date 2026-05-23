-- Dresser — schema + Row Level Security.
-- Run this once in the Supabase SQL editor (console) for a fresh project.
-- Single user in practice, but every row is owner-scoped and RLS is ON,
-- because the anon key ships in the built app and the API is internet-exposed.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id      uuid primary key default gen_random_uuid(),
  owner   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name    text not null,
  unique (owner, name)
);

create table if not exists public.items (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  house      text not null default 'A' check (house in ('A', 'B', 'transit')),
  wears      integer not null default 0 check (wears >= 0),
  wear_limit integer not null default 2 check (wear_limit >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Base layers (underwear, socks, …) are owned in BULK, never named or tracked
-- individually. One row per (owner, house, kind). Clean is DERIVED (total -
-- dirty); the CHECK keeps dirty within [0, total] so clean can never go
-- negative or exceed the total.
create table if not exists public.piles (
  id     uuid primary key default gen_random_uuid(),
  owner  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  house  text not null check (house in ('A', 'B')),
  kind   text not null check (kind in ('Underwear', 'Socks', 'Undershirts', 'Tank Tops')),
  total  integer not null default 0 check (total >= 0),
  dirty  integer not null default 0 check (dirty >= 0 and dirty <= total),
  unique (owner, house, kind)
);

-- Multi-category modelled honestly as a many-to-many join (NOT a JSON column).
create table if not exists public.item_categories (
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id     uuid not null references public.items (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (item_id, category_id)
);

-- Each "did laundry" action recorded — cheap, gives useful history.
create table if not exists public.laundry_events (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  house      text not null check (house in ('A', 'B')),
  item_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists items_owner_idx on public.items (owner);
create index if not exists piles_owner_idx on public.piles (owner);
create index if not exists item_categories_owner_idx on public.item_categories (owner);
create index if not exists laundry_events_owner_idx on public.laundry_events (owner);

-- ---------------------------------------------------------------------------
-- Row Level Security — every row visible/writable only by its owner.
-- ---------------------------------------------------------------------------

alter table public.categories      enable row level security;
alter table public.items           enable row level security;
alter table public.piles           enable row level security;
alter table public.item_categories enable row level security;
alter table public.laundry_events  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'items', 'piles', 'item_categories', 'laundry_events']
  loop
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format(
      'create policy owner_all on public.%I
         for all
         using (owner = auth.uid())
         with check (owner = auth.uid())',
      t
    );
  end loop;
end $$;

-- Role grants. RLS narrows row visibility; grants are still required at the
-- table level. Supabase auto-grants when tables are created through its UI,
-- but raw `create table` migrations (like this one) must grant explicitly.
grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.categories,
  public.items,
  public.piles,
  public.item_categories,
  public.laundry_events
to authenticated;

-- ---------------------------------------------------------------------------
-- "Doing laundry" — reset wears to 0 for every dirty item at a house AND
-- empty every pile's hamper (dirty -> 0) at that house, then record the event,
-- atomically. Owner-scoped via auth.uid() inside the fn.
--
-- Returns the total number of dirty THINGS washed: named items reset, plus the
-- dirty units cleared from piles. (The pile sum is read BEFORE the update,
-- since UPDATE ... RETURNING would only see the new zeroed values.) The
-- laundry_events.item_count column stays items-only — piles are bulk and
-- nameless, so they don't belong in the per-item history.
-- ---------------------------------------------------------------------------

create or replace function public.do_laundry(target_house text)
returns integer
language plpgsql
security invoker
as $$
declare
  reset_count integer;
  pile_count  integer;
begin
  if target_house not in ('A', 'B') then
    raise exception 'do_laundry: house must be A or B, got %', target_house;
  end if;

  with washed as (
    update public.items
       set wears = 0,
           updated_at = now()
     where owner = auth.uid()
       and house = target_house
       and wears >= wear_limit
    returning 1
  )
  select count(*) into reset_count from washed;

  select coalesce(sum(dirty), 0) into pile_count
  from public.piles
  where owner = auth.uid()
    and house = target_house
    and dirty > 0;

  update public.piles
     set dirty = 0
   where owner = auth.uid()
     and house = target_house
     and dirty > 0;

  insert into public.laundry_events (house, item_count)
  values (target_house, reset_count);

  return reset_count + pile_count;
end $$;

grant execute on function public.do_laundry(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed every new user automatically: garment categories + the four base-layer
-- piles at both houses (4 kinds x 2 houses = 8 piles, all starting empty).
-- Base layers are NOT categories anymore — they are piles.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_new_user();

-- Replaces the older seed function name, if it exists from a prior migration.
drop function if exists public.seed_default_categories();

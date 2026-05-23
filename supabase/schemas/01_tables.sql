-- Dresser — tables + indexes (declarative schema).
-- Single user in practice, but every row is owner-scoped and RLS is ON,
-- because the anon key ships in the built app and the API is internet-exposed.
--
-- This file is part of the DECLARATIVE schema in supabase/schemas/. Edit it to
-- describe the desired state, then run `npx supabase db diff -f <name>` to
-- generate a migration. See supabase/README.md.

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

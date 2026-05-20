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
create index if not exists item_categories_owner_idx on public.item_categories (owner);
create index if not exists laundry_events_owner_idx on public.laundry_events (owner);

-- ---------------------------------------------------------------------------
-- Row Level Security — every row visible/writable only by its owner.
-- ---------------------------------------------------------------------------

alter table public.categories      enable row level security;
alter table public.items           enable row level security;
alter table public.item_categories enable row level security;
alter table public.laundry_events  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'items', 'item_categories', 'laundry_events']
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
  public.item_categories,
  public.laundry_events
to authenticated;

-- ---------------------------------------------------------------------------
-- "Doing laundry" — reset wears to 0 for every dirty item at a house and
-- record the event, atomically. Owner-scoped via auth.uid() inside the fn.
-- ---------------------------------------------------------------------------

create or replace function public.do_laundry(target_house text)
returns integer
language plpgsql
security invoker
as $$
declare
  reset_count integer;
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

  insert into public.laundry_events (house, item_count)
  values (target_house, reset_count);

  return reset_count;
end $$;

grant execute on function public.do_laundry(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed the default category set for every new user automatically.
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_categories()
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
    (new.id, 'Undershirts'),
    (new.id, 'Socks'),
    (new.id, 'Underwear'),
    (new.id, 'Pajama Shirts'),
    (new.id, 'Pajama Pants'),
    (new.id, 'Athletic Shirts'),
    (new.id, 'Athletic Shorts'),
    (new.id, 'Tank Tops')
  on conflict (owner, name) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();

-- If you created your user BEFORE running this migration, seed yourself once
-- (run while logged into the SQL editor as that user is not needed — replace
-- the email if you prefer):
--   insert into public.categories (owner, name)
--   select u.id, c.name
--   from auth.users u
--   cross join (values
--     ('Normal Shirts'),('Normal Pants'),('Church Shirts'),('Church Pants'),
--     ('Undershirts'),('Socks'),('Underwear'),('Pajama Shirts'),
--     ('Pajama Pants'),('Athletic Shirts'),('Athletic Shorts'),('Tank Tops')
--   ) as c(name)
--   on conflict (owner, name) do nothing;

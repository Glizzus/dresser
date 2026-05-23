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

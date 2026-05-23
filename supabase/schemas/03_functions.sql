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

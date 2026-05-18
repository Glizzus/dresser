# Claude Code build prompt — Clothes Tracker

Build a personal Clothes Tracker web app called Dresser. This prompt is the final spec. Decisions
below were deliberated and settled — implement them as written; do not re-open them
or substitute alternatives. Where a rationale is given, it exists so you don't
"improve" the decision away.

## Sequencing — important

Build in two phases. **Do not scaffold the whole repo first.**

**Phase 1:** Build the invariant engine as a standalone, pure module with NO
framework dependencies. Write a small fixture (~12 items across two houses,
some dirty, at least two multi-category items) and a script that runs the engine
against it and prints the computed Status output. Then STOP and show me the
output for review. Do not proceed until I confirm the engine is correct.

**Phase 2:** After I confirm the engine, scaffold the full repo around it.

## What the app is

A personal app for one user who splits time between two houses (House A and
House B). It answers one question at a glance: *do I have enough clean clothes
at the house I'm in, and if not, what should I wash?* Single user. Expect dozens
to low-hundreds of items.

## Tech stack (settled — do not substitute)

- Vue 3 (Composition API) + Vite. Real project, real build step.
- Pinia — client state only, kept light: current house, UI flags. Nothing heavy.
- Vue Router — minimal: two tab routes plus sheets as routes.
- TanStack Query (`@tanstack/vue-query`) — the server-state layer over Supabase.
  Provides caching, staleness, refetch on focus/reconnect, loading/error states.
- Supabase — live database (Postgres + auto API + auth). Real cross-device sync.
- Hand-written components against the design tokens below. NO component library
  (no Vuetify/PrimeVue) — it would fight the opinionated design language.
- VueUse — NOT installed by default. Only pull in `useSwipe` if the hand-rolled
  swipe gesture proves fiddly.
- PWA: manifest + service worker, installable to iOS home screen.

## Architecture — strict layering

Each layer knows only the layer below it:

- **Invariant engine** — pure functions. No Vue, no Pinia, no Query, no Supabase.
  Signature: `(invariants, items, house) -> results`. Trivially unit-testable.
- **Supabase repo layer** — the ONLY module that imports the Supabase client.
- **TanStack Query hooks** — wrap the repo (`useItems()`, `useLogWear()`, etc.).
  The only thing components touch for server data. Mutations invalidate queries.
- **Pinia** — small client-only state.
- **Components** — consume Query hooks + Pinia; feed the engine's pure output
  into the Status view.

## Data model

Item: name, one OR MORE categories (multi-category is required — model honestly
as many-to-many, not a JSON column), current house (A / B / transit), `wears`
counter, `wearLimit`.

Rule: `wears < wearLimit` => clean; `wears >= wearLimit` => dirty.

"Doing laundry" at a house resets `wears` to 0 for every dirty item at that house.

Postgres tables: `items`, `categories`, `item_categories` (join), `laundry_events`
(record each laundry action — cheap, gives useful history). Every table owner-scoped.

Categories include at least: Normal Shirts, Church Pants, Undershirts, Socks,
Underwear, Pajama Shirts, Pajama Pants, Athletic Shirts, Athletic Shorts,
Tank Tops, Normal Pants, Church Shirts.

## The invariant engine (the heart of the product)

Invariants are DECLARATIVE DATA, not classes, not lambdas, not plugins. Every
invariant has the same shape and the same evaluator — they vary in data, not
behavior:

```
{ id, label, count, slots: [categoryName, ...] }
```

One pure function `evaluate(invariant, items, house)`:
1. Filter items to `house`; split clean vs dirty; bucket clean items by category.
2. Try to fill every slot `count` times over using DISTINCT clean items,
   assigning freshest-first (lowest `wears`).
3. Return: satisfied bool, have/need numbers, and on failure the bottleneck slot
   plus a one-line fix.

Critical engine rules:
- **Across invariants: independent readings.** A clean pair of socks satisfies
  every invariant it's eligible for. No allocation, no "spending" an item.
- **Within one invariant: items are distinct.** `count: 2` work outfits needs
  2 distinct clean undershirts, 2 distinct clean pants, etc.
- **Bottleneck** = the slot with the worst shortfall.
- **Honest fix line.** Distinguish "wash N dirty undershirts" (dirty inventory
  exists to wash) from "no undershirts here" (zero items of that category at
  this house, dirty or clean — washing cannot help). Never say "wash N" when
  there is nothing to wash.
- Multi-category items appear in every category bucket they belong to.

Invariant DEFINITIONS live as app config (not DB rows). Default invariants,
evaluated per house:
- >=1 wearable pajama set (clean Pajama Shirt + clean Pajama Pants)
- >=2 wearable work outfits (Normal Shirt + Pants + Undershirt + Socks + Underwear)
- >=1 church outfit (Church Shirt + Church Pants + Undershirt + Socks + Underwear)
- >=3 clean sock pairs
- >=3 clean underwear

Thresholds are plain numbers in config — keep them easily editable.

## Screens — TWO tabs only

House switcher at the top of every screen: manual segmented control (A / B),
with red broken-invariant count badges per house.

**1. Inventory** — every item, grouped by category, filterable All / Clean /
Dirty / category. Swipe a row to reveal actions: **log a wear** (the daily-driver
gesture — increments `wears`), **mark dirty**, **move to other house**. Tap a row
=> edit sheet.

**2. Status** — binary invariant dashboard. Summary banner ("3 invariants broken"
/ "All holding"), then sections: **Broken**, **Holding**, **Hamper**. Each broken
card shows have/need, the bottleneck category, and the one-line fix. Hamper =
dirty items grouped by category.

**Edit item sheet** — name, multi-category picker, location (A / B / transit),
wear-limit stepper, mark dirty/clean, delete.

**Did-laundry sheet** — per-house action. Shows hamper contents grouped by
category; commit resets `wears` to 0 for dirty items at that house and records
a `laundry_events` row. No prediction line.

## Cross-cutting behavior

- House switching is manual; tapping the other house = "I arrived there."
- Items with location `transit` auto-arrive at the destination house when the
  user switches houses. Surface this via a dismissible toast ("3 items arrived
  at House B"). No separate "I have arrived" step.
- Wear meter visual: a tiny row of dots + a label ("fresh" / "N left" / "dirty").
  This replaces any ambiguous "0/2" fraction.
- JSON export/import: a button to dump all items to a JSON file and re-import it.
  This is the backstop against browser storage loss / for portability. Build it
  into v1, not later.

## Auth & security (not optional)

Supabase tables are internet-exposed via the API; the anon key ships in the
built app. Therefore:
- Auth ON — magic-link login (no password to manage). One login screen.
- Row Level Security ON — every row visible/writable only by its owner.
Deliver the schema as a SQL migration file I run in the Supabase console,
including the RLS policies.

## Explicitly OUT of scope

No geofencing / GPS / location permissions. No "Today" tab and no saved outfit
templates / outfit pills. No "Running Low" status section (Status is binary:
broken or holding). No laundry prediction ("fixes N invariants"). No wash
temperature / color sorting. No outfit photos. No multi-user / household sharing.
No calendar features. No purchase recommendations. No full offline-write-then-sync
(v1: reads cache, writes need connectivity — state this as a known limitation).

## Design language

Calm off-white background `#F4F2EC`. System fonts. Monoline icons. One warm-red
accent `#B8463A`, used ONLY for warnings and the broken-invariant chip/badge.
No gradients, no skeuomorphism.

## Deliverables

- Phase 1: the pure engine module + fixture + a run script, output shown for review.
- Phase 2: full repo — Vite scaffold, `package.json`, the Supabase SQL migration
  (schema + RLS), the repo layer, TanStack Query hooks, Pinia store, Vue Router
  setup, all components and sheets, the swipe interaction, PWA manifest + service
  worker, and a README covering Supabase project setup and how to run locally.
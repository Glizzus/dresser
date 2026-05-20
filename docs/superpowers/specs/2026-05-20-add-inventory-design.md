# Design — Add Clothes to Inventory

**Date:** 2026-05-20
**Source spec:** [`specs/ADD-INVENTORY.FEATURE.MD`](../../../specs/ADD-INVENTORY.FEATURE.MD)
**Status:** Ready for implementation planning

This design rebuilds the "add an article of clothing" flow from scratch against the
feature spec. It treats the spec as the source of truth and ignores that the
codebase already contains a partial implementation of the same flow inside
`ItemSheet.vue`. The existing data layer (Supabase schema, repo, query hooks)
is reused without modification; only the UI of the add path is replaced.

The user is learning UI/UX, so each major design decision is paired with the
principle that drives it. Backend choices are stated without elaboration.

## Decisions settled during brainstorming

| Decision | Choice |
| --- | --- |
| Scope | Full rebuild of the add path from the spec; data layer reused unchanged |
| Category-grid organization | Grouped by garment (Tops / Bottoms / Base layer) |
| Location selector | House A and B as equal primary buttons; "in transit" as a small text link below |
| Container | Full-screen page at `/inventory/new` (not a bottom sheet) |
| Grouping persistence | Hardcoded in the frontend; categories table stays a flat list |

## Architecture

A new top-level view, `src/views/NewItemView.vue`, replaces the current sheet-based
add flow. The route map changes shape:

- `/inventory` → `InventoryView` (unchanged).
- `/inventory/new` → `NewItemView` as a **standalone route**. No sheet overlay,
  no parent inventory render-behind. The `+` FAB on `InventoryView` navigates
  here via `router.push('/inventory/new')`.
- `/inventory/:id` → unchanged; still opens `ItemSheet` over inventory for editing.

The edit flow is out of scope for this story and stays as-is. `ItemSheet.vue`'s
"new" branch becomes dead code — we delete that branch from the sheet so it has
a single responsibility (edit only).

The data layer is untouched:

- `useCategories()` query, `useCreateItem()` mutation — reused unchanged.
- `repo.listCategories`, `repo.createItem` — reused unchanged.
- Supabase schema, RLS policies, seeded default categories — unchanged.

A small pure helper, `src/lib/categoryGroups.ts`, holds the hardcoded
`categoryName → group` mapping and a `groupCategories(categories)` function
that returns groups in display order with their member categories. No Vue
imports; trivially unit-testable.

The mapping for the seeded default categories:

| Group | Categories (in display order) |
| --- | --- |
| Tops | Normal Shirts, Church Shirts, Pajama Shirts, Athletic Shirts, Tank Tops |
| Bottoms | Normal Pants, Church Pants, Pajama Pants, Athletic Shorts |
| Base layer | Undershirts, Socks, Underwear |

Group order: Tops → Bottoms → Base layer → Other. The "Other" group only
renders when a category with no mapping exists, so it stays invisible for
the default-seeded state.

## Components

| File | Responsibility |
| --- | --- |
| `src/views/NewItemView.vue` | Full-screen page. Header (Cancel / "New item" / Save), four stacked sections, owns form state, calls `useCreateItem`. |
| `src/components/GroupedCategoryPicker.vue` | Multi-select grid grouped by garment. Replaces the flat chip cloud for the add flow. Edit flow keeps the existing `CategoryPicker.vue`. |
| `src/components/LocationField.vue` | A/B button pair + "in transit" text link. Encapsulates the de-emphasis treatment. |
| `src/lib/categoryGroups.ts` | Pure mapping + ordering helper. |

The wear-limit stepper is **not** extracted into its own component — it is
roughly ten lines of inline template with a single consumer; extracting it
would be premature.

## Data flow

State in `NewItemView`: four refs.

```ts
const name = ref('')
const categoryIds = ref<string[]>([])
const house = ref<House>('A')
const wearLimit = ref(2)
```

Validation is a single derived boolean:

```ts
const canSave = computed(
  () => name.value.trim().length > 0 && categoryIds.value.length > 0,
)
```

Save flow:

1. User taps Save.
2. `useCreateItem.mutateAsync({ name: name.value.trim(), categoryIds: categoryIds.value, house: house.value, wearLimit: wearLimit.value })`.
3. The mutation's `onSuccess` (existing wiring) invalidates `itemsKey`; `InventoryView` refetches.
4. `router.replace('/inventory')` — replace, not push, so Back from inventory does not return to a stale form.
5. `ui.pushToast(`${name} added`)`.

Cancel: returns to `/inventory` without confirmation. The form is throwaway state.

Wear-limit stepper rules: `−` clamps at 1 (disabled at 1); `+` increments without
a cap. No keyboard / numeric input — the spec is explicit, and the stepper
removes the entire class of "what if they type 0.5 or -3" bugs by construction.

## UX rationale (the teaching section)

Seven principles drove the visible decisions. They are stated alongside the
decision they justify so the pattern, not just the outcome, is portable to
future work.

### 1. Modal weight matches task weight

A bottom sheet says "quick acknowledgement" (the laundry sheet, the edit
nudge). A full-screen page says "deliberate work" (adding a new garment).
Same data underneath, different cognitive weight. The container is a promise
about how much attention is being asked of the user. Mismatching that promise
makes the interface feel either cramped or pompous.

Applied: the add flow is a full-screen page; the edit flow remains a sheet,
because the dominant edit operation is a small tweak (rename, change wear limit).

### 2. The shape of rarity

Frequency should be visible in the geometry. House A and House B fill the row
as equal primaries; "in transit" lives below as a small underlined text
affordance. This communicates *use it when you need it; otherwise ignore*
without resorting to "hide behind a menu," which would punish the user when
they do need it. Hiding rare options is a common over-correction.

Applied: location field renders A/B side by side, with a left-aligned text
link below them.

### 3. Constraints become structure

Grouping the category grid by garment doesn't just look organized — it
surfaces a real constraint of the world: a shirt isn't pants. The user does
not have to think about the rule because the layout demonstrates it. When you
catch yourself wanting to write a rule into copy ("note: shirts cannot be
pants"), check whether the layout can express it for you. It almost always
can, and the layout version is almost always clearer.

Applied: `GroupedCategoryPicker` renders one labelled group per garment type
and displays each category's name verbatim from the database (e.g.,
"Normal Shirts", "Athletic Shorts"). Selecting "Normal Shirts" and
"Normal Pants" together is technically possible but visually demonstrates
"these are different things."

### 4. Defaults are gifts

The form opens with House A selected, wear limit at 2, no categories chosen,
and focus on the Name field. Each default is a decision the user does not
have to make. We pick the right default for the dominant case — "I'm setting
up clothes at home, they'll usually be reworn twice." The minority case
(an athletic shirt with a 1-wear limit) still costs one tap. Defaults are
how interfaces respect time.

Applied: the initial state of the form, including the focused name input.

### 5. Disabled gates, errors correct

The Save button is disabled until name and at least one category exist.
That is the entire validation UI — no red borders, no inline error messages.
There are two kinds of "not OK." *Not yet* (the user hasn't supplied required
info) is gentle; the disabled state quietly says "still missing something."
*You broke a rule* (e.g., the server rejected a save) is sharper and gets an
explicit message. Mixing them — showing "Name is required" before the user
has finished typing — feels accusatory and noisy.

Applied: `canSave` controls the Save button's `disabled` attribute. The
toast pattern is reserved for actual errors and for the post-save
acknowledgement.

### 6. Affordance over input

The wear-limit stepper buttons cannot produce a 0, a -3, or a 0.5. A numeric
input field cannot make that claim. We pay one extra tap for "set wear limit
to 5" and avoid an entire category of bugs and weird states. The disabled
`−` button at 1 is its own piece of teaching: "this is the floor."

Applied: stepper, no numeric input, `−` disabled at 1.

### 7. Acknowledge, then confirm

After save: toast plus navigation to inventory. The toast acknowledges
("we heard you"), and the new row appearing in the inventory list confirms
("and here it is, real"). Two signals layered, each doing different work.
Avoid the trap of only the toast (did it actually save?) or only the silent
navigate (did the tap register?).

Applied: `pushToast` plus `router.replace`.

## Error handling

- `useCreateItem.mutateAsync` is awaited in a try/catch. On error, post a toast
  `Couldn't save: <message>` and leave the form populated for retry. No silent
  failures.
- Offline writes are not queued. The spec lists "writes need connectivity" as
  a known v1 limitation; the catch path surfaces the failure honestly.
- Auth lapse: if the session expired, `repo.createItem` fails with an auth
  error, hitting the same catch path. `App.vue`'s `onAuthChange` returns the
  user to login on the next tick.

## Testing

- `src/lib/categoryGroups.test.ts` — pure unit tests for the grouping helper.
  Cases: known names land in the right group; unknown names land in "Other";
  empty input returns no groups; display order is stable.
- `src/views/NewItemView.test.ts` — component test with `@vue/test-utils` and
  `happy-dom`. Cases: renders the four sections; Save is disabled with empty
  form; Save enables once name and a category are present; clicking Save
  invokes the create mutation with the expected `ItemDraft`; navigates and
  pushes a toast on success. Query hooks are mocked.

No new engine tests; the engine layer is unaffected.

## Out of scope

- Editing existing items (continues to use the existing `ItemSheet.vue`).
- Inventory list features beyond the existing "grouped by category" view.
- Adding new categories from the add-item screen.
- Custom or user-defined category groups (the grouping is hardcoded by name).
- Batch entry / "add another" mode.
- Offline write queueing.

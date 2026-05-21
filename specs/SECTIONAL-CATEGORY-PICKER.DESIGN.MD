# Design: Sectional Category Picker

A UX revision to the category selection control used in the add-item flow
(`GroupedCategoryPicker`, mounted inside `NewItemView`). Existing
flat-multi-select grid is replaced with an **in-place two-step wizard**:
the user first picks a *group* (Tops / Bottoms / Base layer / Other),
then picks one or more subcategories within that group.

This document is both a design spec and a UI/UX teaching artifact.
Decisions are accompanied by the principles that drove them.

## Problem

`GroupedCategoryPicker` today renders every category group as a section
heading with a 2-column chip grid below it. All chips on the page are
co-equal multi-select toggles. This produces two related problems:

1. **The UI permits invalid states.** A single article of clothing can be
   tagged with both a Top and a Bottom — but per
   `specs/ADD-INVENTORY.FEATURE.MD`, *"pants cannot be a work shirt"*. The
   real-world rule (groups are mutually exclusive at the item level) is
   not enforced anywhere; the picker is a flat checkbox grid wearing a
   hat.
2. **Screen real estate is spent on irrelevant sections.** A user adding
   a shirt scrolls past Bottoms, Base layer, and Other while never
   intending to interact with them. On mobile this costs scroll,
   attention, and tap-target ambiguity.

## UX principles in play

- **Constraints should mirror reality (Don Norman).** Good UI makes
  invalid actions impossible, not merely discouraged. If a garment cannot
  be both a Top and a Bottom, the control should not permit the tap.
- **Progressive disclosure (Nielsen, Krug).** Show only what is relevant
  to the next decision. Once a group is chosen, the other groups are
  noise.
- **Recognition vs. recall (Nielsen heuristic #6).** The argument for
  showing every group upfront is that users *recognize* where their item
  belongs faster than they can *recall* a taxonomy. That benefit is real
  for the first decision and evaporates after.
- **Reserve confirmation for high-cost reversible actions.** Confirmation
  dialogs for cheap, one-tap-reversible state changes train users to
  dismiss dialogs without reading — which is exactly how real
  data-loss confirmations get clicked through.

## Chosen pattern: in-place two-step wizard (A1)

The Categories field has two states. The rest of the form (Name,
Location, Wear limit, Save) is unchanged.

### State A — Group picker (initial)

A 2×2 grid of group buttons rendered in the same visual slot as today's
chip grid. Empty groups are omitted (current behaviour of
`groupCategories`), so "Other" disappears unless something is mapped to
it.

```
┌─ Categories ─────────────────┐
│ [ Tops      ]  [ Bottoms ]   │
│ [ Base layer]  [ Other   ]   │
└──────────────────────────────┘
```

### State B — Subcategory picker

Tapping a group transitions the field to State B:

- The group buttons are replaced by a small "Tops · change" affordance
  at the top of the field (text link, left-aligned).
- Below the affordance, the existing multi-select chip grid renders the
  subcategories of the chosen group.

```
┌─ Categories ─────────────────┐
│ Tops · change                │
│ [Normal]   [Church]          │
│ [Pajama]   [Athletic] [Tank] │
└──────────────────────────────┘
```

### Swapping groups

Tapping "change" returns the field to State A **and silently clears any
selected subcategories.** A Tops selection has no meaning once the user
is shopping in Bottoms; preserving it would re-introduce the
cross-group ambiguity this design exists to eliminate.

No confirmation dialog. The "change" tap *is* the confirmation. If
post-launch usage shows the clear feels destructive, the next cheapest
intervention is an undo toast ("Cleared Tops · Undo"). Out of scope for
this iteration (YAGNI).

## Rejected alternatives

**Multi-step wizard (A2).** Paginate the entire NewItemView into two
screens: name + group, then subcategories + location + wear limit.
Rejected: the form is small enough (four fields) that pagination is
overkill. Pages should chunk *concepts*, not *fields*. Adding a Back /
Next / progress indicator for four short fields adds chrome with no
clarity benefit.

**Auto-collapsing groups (B).** All four groups render initially; the
first chip tap collapses the other three into a "← change type" pill.
Rejected: the exclusivity rule is taught only by the collapse
animation, which is a fragile pedagogy. The wizard makes the rule
explicit instead of implicit.

**Accordion (C).** Always-visible group headers; only one expanded at a
time. Rejected: does not enforce exclusivity unless selection is also
bound to the open section, and that coupling is a hidden rule users
must infer.

## Save validation

`canSave` in `NewItemView` already requires
`name.trim().length > 0 && categoryIds.length > 0`. This rule continues
to function unchanged across both wizard states:

- State A, no group picked → `categoryIds` is empty → Save disabled.
- State B, no chips tapped → `categoryIds` is empty → Save disabled.
- State B, ≥1 chip tapped → Save enabled.

No new validation rules are introduced.

## Edge cases

- **"Other" with no items.** `groupCategories` already returns only
  non-empty groups. The wizard inherits this: users see 3 group buttons
  (Tops / Bottoms / Base layer) until custom categories add an Other
  entry, at which point the button appears automatically. No special
  case needed.
- **Zero groups.** Cannot occur with seeded categories, but if `groups`
  is empty the picker renders an inert empty state instead of throwing.

## Implementation surface

Changes are contained almost entirely within
`src/components/GroupedCategoryPicker.vue`.

- Add local state: `selectedGroup: CategoryGroup | null`, initialised to
  `null`.
- When `selectedGroup === null`, render the group buttons. Tapping a
  button sets `selectedGroup` to that group's name. No model emit.
- When `selectedGroup !== null`, render the "Group · change" link and
  the chips for that group. Chip taps emit
  `update:modelValue` as today.
- Tapping "change" emits `update:modelValue([])` and resets
  `selectedGroup` to `null`.

`NewItemView.vue` and the data model (`categoryIds: string[]` on
`ItemDraft`) are unchanged. The parent's contract with the picker
(`v-model` of `string[]`) is preserved.

This containment is itself a design property worth naming: clean
component boundaries mean a component's internal interaction model can
be reworked without rippling into the parent or the data layer. A
component is well-bounded if you can rewrite *how the user picks* without
touching *what got picked*.

## Testing

`src/components/GroupedCategoryPicker.test.ts` covers chip toggle
behaviour today. Add cases:

- Initial render shows group buttons, not chips.
- Tapping a group reveals that group's chips.
- Tapping a chip emits the expected id in `update:modelValue`.
- Tapping "change" clears selections (emits `[]`) and returns to State
  A.
- "Other" group is omitted when no categories map to it (regression
  guard).

`src/views/NewItemView.test.ts` is expected to be untouched — the
contract surface it exercises is unchanged. If a name-and-categories
happy-path test is sensitive to the picker's internal markup, it gets
updated to traverse via the new flow (tap group → tap chip → save).

## Out of scope

- An "undo" toast after the silent clear on group change.
- Animated transitions between State A and State B.
- Custom-category creation (no UI exists for it today).
- Reworking the read-side view of categories on the inventory list.

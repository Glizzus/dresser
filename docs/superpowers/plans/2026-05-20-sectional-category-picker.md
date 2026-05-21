# Sectional Category Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat multi-select chip grid in `GroupedCategoryPicker` with an in-place two-step wizard (group → subcategories), enforcing the real-world rule that a single item belongs to exactly one group.

**Architecture:** All behavior change is contained inside `src/components/GroupedCategoryPicker.vue`. The component adds local state `selectedGroup: CategoryGroup | null` and renders one of two states inside the same field: State A = group buttons, State B = subcategory chips for the chosen group plus a "change" affordance. The component's external contract (v-model on `string[]`) is unchanged, so `NewItemView.vue` and the data model are untouched. Test files that traverse the picker's internals are updated to enter via a group button first.

**Tech Stack:** Vue 3 (script-setup, Composition API), TypeScript, Vitest + @vue/test-utils + happy-dom.

**Spec:** `specs/SECTIONAL-CATEGORY-PICKER.DESIGN.MD`

---

## File map

- **Modify:** `src/components/GroupedCategoryPicker.vue` — add wizard state and two-state render
- **Modify:** `src/components/GroupedCategoryPicker.test.ts` — replace label-section assertions, prepend group-click in chip tests, add new tests for State A and "change"
- **Modify:** `src/views/NewItemView.test.ts` — prepend group-click before chip-click in three existing tests

No new files. No file splits needed; the component is ~80 lines after the change.

---

## Task 1: Implement State A (group picker) + atomic test updates

**Files:**
- Modify: `src/components/GroupedCategoryPicker.vue`
- Modify: `src/components/GroupedCategoryPicker.test.ts`
- Modify: `src/views/NewItemView.test.ts`

This is an atomic refactor: the component's render contract on first paint flips from "chip grid by group" to "group buttons." All tests that depend on chips-visible-on-mount must update in the same commit so the suite stays green at task end.

- [ ] **Step 1: Rewrite `GroupedCategoryPicker.test.ts` to express the new contract**

Replace the existing first test ("renders one labelled section per non-empty group") with a State A test, and prepend a group-button click in each of the three chip tests so they enter State B before asserting on chips.

```typescript
// src/components/GroupedCategoryPicker.test.ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupedCategoryPicker from './GroupedCategoryPicker.vue'
import type { CategoryRow } from '@/lib/types'

const OPTIONS: CategoryRow[] = [
  { id: 't1', name: 'Normal Shirts' },
  { id: 't2', name: 'Church Shirts' },
  { id: 'b1', name: 'Normal Pants' },
  { id: 's1', name: 'Socks' },
]

describe('GroupedCategoryPicker', () => {
  it('renders one group button per non-empty group on initial mount (State A)', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    const groups = wrapper.findAll('[data-group]').map((n) => n.attributes('data-group'))
    expect(groups).toEqual(['Tops', 'Bottoms', 'Base layer'])
    expect(wrapper.findAll('[data-cat-id]')).toHaveLength(0)
  })

  it('reveals that group\'s chips after tapping a group button (State B)', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    const chipIds = wrapper.findAll('[data-cat-id]').map((n) => n.attributes('data-cat-id'))
    expect(chipIds).toEqual(['t1', 't2'])
    expect(wrapper.findAll('[data-group]')).toHaveLength(0)
  })

  it('marks selected chips with the "on" class', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    expect(wrapper.get('[data-cat-id="t1"]').classes()).toContain('on')
    expect(wrapper.get('[data-cat-id="t2"]').classes()).not.toContain('on')
  })

  it('emits update:modelValue with the id added when toggling unselected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![0][0]).toEqual(['t1'])
  })

  it('emits update:modelValue with the id removed when toggling selected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 't2'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits![0][0]).toEqual(['t2'])
  })
})
```

- [ ] **Step 2: Rewrite the three chip-using tests in `NewItemView.test.ts`**

Three tests reach into the picker via `[data-cat-id="c-shirt"]`. After Task 1, that selector returns nothing on mount because chips are hidden until a group is picked. Prepend `await wrapper.get('[data-group="Tops"]').trigger('click')` before each chip click. The seeded mock category `c-shirt` has `name: 'Normal Shirts'`, which maps to group `Tops`.

```typescript
// In `disables Save until name and at least one category are present`:
await wrapper.get('[data-test="name"]').setValue('Blue Oxford')
expect(saveBtn().attributes('disabled')).toBeDefined()

await wrapper.get('[data-group="Tops"]').trigger('click')
await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
expect(saveBtn().attributes('disabled')).toBeUndefined()
```

```typescript
// In `calls createItem with the trimmed draft and navigates + toasts on success`:
await wrapper.get('[data-test="name"]').setValue('  Blue Oxford  ')
await wrapper.get('[data-group="Tops"]').trigger('click')
await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
await wrapper.get('[data-house="B"]').trigger('click')
await wrapper.get('[data-test="wear-inc"]').trigger('click')
```

```typescript
// In `toasts an error message and stays on the page when createItem rejects`:
await wrapper.get('[data-test="name"]').setValue('Tee')
await wrapper.get('[data-group="Tops"]').trigger('click')
await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
await wrapper.get('[data-test="save"]').trigger('click')
```

The "clamps the wear-limit decrement at 1" test does not touch chips and is unchanged.

- [ ] **Step 3: Run the test suite — confirm RED**

Run: `npm test`

Expected: multiple failures in `GroupedCategoryPicker.test.ts` and `NewItemView.test.ts` because `[data-group="Tops"]` does not exist yet in the current component template.

- [ ] **Step 4: Rewrite `GroupedCategoryPicker.vue` to implement State A and State B**

Replace the file's contents:

```vue
<script setup lang="ts">
// Two-step wizard for the add-item flow. The user first picks a group
// (Tops/Bottoms/Base layer/Other), then multi-selects subcategories
// within that group. Enforces the rule that a single item belongs to
// exactly one group.
import { computed, ref } from 'vue'
import type { CategoryRow } from '@/lib/types'
import { groupCategories, type CategoryGroup } from '@/lib/categoryGroups'

const props = defineProps<{
  modelValue: string[]
  options: CategoryRow[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const groups = computed(() => groupCategories(props.options))
const selectedGroup = ref<CategoryGroup | null>(null)

const currentItems = computed(() => {
  if (selectedGroup.value === null) return []
  return groups.value.find((g) => g.group === selectedGroup.value)?.items ?? []
})

function toggle(id: string) {
  const set = new Set(props.modelValue)
  set.has(id) ? set.delete(id) : set.add(id)
  emit('update:modelValue', [...set])
}
</script>

<template>
  <div class="picker">
    <div
      v-if="selectedGroup === null"
      class="group-buttons"
      data-test="group-grid"
    >
      <button
        v-for="g in groups"
        :key="g.group"
        type="button"
        class="group-button"
        :data-group="g.group"
        @click.stop="selectedGroup = g.group"
      >
        {{ g.group }}
      </button>
    </div>
    <div v-else>
      <div class="grid">
        <button
          v-for="c in currentItems"
          :key="c.id"
          type="button"
          class="chip"
          :class="{ on: modelValue.includes(c.id) }"
          :data-cat-id="c.id"
          @click.stop="toggle(c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.group-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.group-button {
  text-align: center;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 14px 8px;
  font-size: 0.95rem;
  color: var(--ink);
  min-height: var(--tap);
  font-weight: 500;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.chip {
  text-align: center;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 10px 6px;
  font-size: 0.86rem;
  color: var(--ink-soft);
  min-height: var(--tap);
}
.chip.on {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
</style>
```

Note: this step intentionally leaves out the "change" affordance — that arrives in Task 2 with its own test. The State B template here is a `<div>` containing only the chip grid (no header, no change link). That keeps Task 1 minimal and TDD-honest.

- [ ] **Step 5: Run the test suite — confirm GREEN**

Run: `npm test`

Expected: all `GroupedCategoryPicker.test.ts` tests pass, all `NewItemView.test.ts` tests pass.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`

Expected: no errors. (`CategoryGroup` is imported as a type-only export; verify `src/lib/categoryGroups.ts` exports it — it does, at line 8.)

- [ ] **Step 7: Commit**

```bash
git add src/components/GroupedCategoryPicker.vue \
        src/components/GroupedCategoryPicker.test.ts \
        src/views/NewItemView.test.ts
git commit -m "Add group-picker first step to GroupedCategoryPicker

User now picks Tops/Bottoms/Base layer before seeing subcategories.
Enforces the cross-group exclusivity required by the spec.
Change affordance arrives in the next commit."
```

---

## Task 2: Add "change" affordance in State B

**Files:**
- Modify: `src/components/GroupedCategoryPicker.vue`
- Modify: `src/components/GroupedCategoryPicker.test.ts`

State B currently has no way back to State A. This task adds a "Tops · change" link above the chip grid; tapping it returns the picker to State A and silently clears any selected subcategories (per spec §3).

- [ ] **Step 1: Add the failing test for the change affordance**

Append to `src/components/GroupedCategoryPicker.test.ts`, inside the existing `describe` block:

```typescript
it('returns to State A and clears selections when "change" is tapped', async () => {
  const wrapper = mount(GroupedCategoryPicker, {
    props: { modelValue: ['t1', 't2'], options: OPTIONS },
  })
  await wrapper.get('[data-group="Tops"]').trigger('click')
  await wrapper.get('[data-test="change-group"]').trigger('click')

  const emits = wrapper.emitted('update:modelValue')
  expect(emits).toBeTruthy()
  expect(emits![emits!.length - 1][0]).toEqual([])

  const groups = wrapper.findAll('[data-group]').map((n) => n.attributes('data-group'))
  expect(groups).toEqual(['Tops', 'Bottoms', 'Base layer'])
  expect(wrapper.findAll('[data-cat-id]')).toHaveLength(0)
})

it('shows the current group name in the change row', async () => {
  const wrapper = mount(GroupedCategoryPicker, {
    props: { modelValue: [], options: OPTIONS },
  })
  await wrapper.get('[data-group="Bottoms"]').trigger('click')
  expect(wrapper.get('[data-test="change-row"]').text()).toContain('Bottoms')
})
```

- [ ] **Step 2: Run tests — confirm RED**

Run: `npm test -- GroupedCategoryPicker`

Expected: the two new tests fail because `[data-test="change-group"]` and `[data-test="change-row"]` do not exist.

- [ ] **Step 3: Implement the change affordance in `GroupedCategoryPicker.vue`**

Edit the `<script setup>` block — add the handler:

```typescript
function changeGroup() {
  emit('update:modelValue', [])
  selectedGroup.value = null
}
```

Edit the `<template>` — replace the `v-else` block with one that includes the change row above the chip grid:

```vue
    <div v-else>
      <div class="change-row" data-test="change-row">
        <span class="group-name">{{ selectedGroup }}</span>
        <button
          type="button"
          class="change-link"
          data-test="change-group"
          @click.stop="changeGroup"
        >
          · change
        </button>
      </div>
      <div class="grid">
        <button
          v-for="c in currentItems"
          :key="c.id"
          type="button"
          class="chip"
          :class="{ on: modelValue.includes(c.id) }"
          :data-cat-id="c.id"
          @click.stop="toggle(c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </div>
```

Edit the `<style scoped>` block — append the change-row styles:

```css
.change-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}
.group-name {
  font-size: 0.85rem;
  color: var(--ink);
  font-weight: 500;
}
.change-link {
  border: none;
  background: none;
  color: var(--ink-soft);
  font-size: 0.85rem;
  padding: 6px 0;
  min-height: var(--tap);
  cursor: pointer;
}
```

- [ ] **Step 4: Run tests — confirm GREEN**

Run: `npm test`

Expected: all tests pass, including the two new ones.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/GroupedCategoryPicker.vue \
        src/components/GroupedCategoryPicker.test.ts
git commit -m "Add change affordance to wizard State B

Tapping 'change' returns to the group picker and clears any selected
subcategories — a Tops selection has no meaning under Bottoms. No
confirmation dialog: the tap is itself the confirmation, and asking
'are you sure?' for a one-tap reversible action trains users to
dismiss dialogs."
```

---

## Task 3: Manual verification in the dev server

**Files:** none modified — this task is observational.

The unit tests cover the contract but not the felt experience (animation, tap targets, visual hierarchy). Walk through the flow in a real browser before declaring done.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite prints a local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Sign in and navigate to `/inventory/new`**

(If sign-in is required, use the existing login flow. The route was promoted to standalone in commit `fe7bd30`.)

- [ ] **Step 3: Verify State A on mount**

Confirm:
- Three group buttons visible (Tops, Bottoms, Base layer) — "Other" is absent because no seeded categories map there.
- No chips visible.
- Save is disabled.
- Buttons feel tappable (min-height ≥ 44px target).

- [ ] **Step 4: Verify State A → State B transition**

Tap **Tops**. Confirm:
- Group buttons disappear.
- A "Tops · change" row appears.
- Subcategory chips for Tops (Normal/Church/Pajama/Athletic Shirts, Tank Tops) appear.
- Save is still disabled (no chip tapped yet).

- [ ] **Step 5: Verify chip toggle and Save enable**

Tap **Normal Shirts**. Confirm chip becomes filled (dark background). Enter a name. Confirm Save becomes enabled.

- [ ] **Step 6: Verify change clears and returns**

Tap **change**. Confirm:
- Group buttons reappear (State A).
- Name field still has the name you typed.
- Save is disabled again (categoryIds is empty).
- Tapping a different group (e.g. **Bottoms**) shows Bottoms subcategories with **none selected** — the prior Tops selection did not leak across groups.

- [ ] **Step 7: Verify a full save round-trip**

In Bottoms, tap **Normal Pants**, leave location at A, hit **Save**. Confirm:
- Navigation lands on `/inventory`.
- A toast appears (`<name> added`).
- The new item appears in the inventory list under its category.

- [ ] **Step 8: Stop the dev server**

Press Ctrl-C in the dev-server terminal.

This task does not commit anything. If steps 3–7 reveal a defect, fix it via a new task that follows the same TDD shape (failing test → impl → commit), then re-run this manual sweep.

---

## Self-review

**Spec coverage:**
- §1 two states → Task 1 step 4 (State A), Task 2 step 3 (State B with change row).
- §3 swap clears silently with no dialog → Task 2 step 1 (test asserts emitted `[]`, no confirmation surface mentioned anywhere in impl).
- §4 save validation unchanged → relies on `NewItemView`'s existing `canSave`; Task 1 step 2 verifies it still gates correctly via the updated NewItemView test.
- §5 "Other" hidden when empty → Task 1 step 1 first test asserts only three groups appear from `OPTIONS`, which contains no Other-mapped entries.
- §5 zero groups → `v-for` over an empty array renders nothing; not separately covered by a test (low-value test for a can't-happen case).
- §6 implementation surface (only `GroupedCategoryPicker.vue` changes, parent contract preserved) → Task 1 step 4 keeps the same props/emit signature; Tasks touch only the listed files.
- §7 testing list → Tasks 1 and 2 collectively add: initial group buttons, group→chip reveal, chip emit add, chip emit remove, change clears + returns, group name in change row, "Other" hidden when empty.

**Placeholder scan:** No TBD/TODO/"appropriate error handling"/etc. Every code step is concrete.

**Type consistency:** `selectedGroup: CategoryGroup | null` used in both tasks. `changeGroup()` handler name matches between script declaration and template binding. `data-group`, `data-test="change-group"`, `data-test="change-row"` selectors match between test assertions and template attributes.

---

## Out of scope (do not implement)

- "Undo" toast after silent clear.
- Animated transitions between states.
- Custom-category creation UI.
- Reworking the read-side view of categories on the inventory list.

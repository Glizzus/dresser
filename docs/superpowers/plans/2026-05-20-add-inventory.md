# Add Clothes to Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "add an article of clothing to inventory" flow as a full-screen page at `/inventory/new`, with a grouped multi-select category grid and a de-emphasized "in transit" location option, per [the design doc](../specs/2026-05-20-add-inventory-design.md).

**Architecture:** Reuse the existing Supabase repo + TanStack Vue Query layer untouched. Add one pure grouping helper, two presentational components (`GroupedCategoryPicker`, `LocationField`), and one full-screen view (`NewItemView`). Promote `/inventory/new` from a sheet child to a standalone route. Delete the create-mode dead branch in `ItemSheet.vue` so it has a single responsibility (edit).

**Tech Stack:** Vue 3 (Composition API, `<script setup lang="ts">`), Vite, Pinia, TanStack Vue Query, Vitest, `@vue/test-utils`, `happy-dom`.

---

## File Structure

| Operation | Path | Responsibility |
| --- | --- | --- |
| Create | `src/lib/categoryGroups.ts` | Pure helper: maps a `CategoryRow` list to display-ordered groups. |
| Create | `src/lib/categoryGroups.test.ts` | Unit tests for the helper. |
| Create | `src/components/GroupedCategoryPicker.vue` | Multi-select grid grouped by garment. Replaces the flat chip cloud for the add flow only. |
| Create | `src/components/GroupedCategoryPicker.test.ts` | Component test: renders groups, toggles selection, emits `update:modelValue`. |
| Create | `src/components/LocationField.vue` | A/B equal-weight buttons plus a small "in transit" text link. |
| Create | `src/components/LocationField.test.ts` | Component test: renders treatment, emits on click. |
| Create | `src/views/NewItemView.vue` | Full-screen page; owns form state; calls `useCreateItem`; navigates + toasts on success. |
| Create | `src/views/NewItemView.test.ts` | Component test: save disabled until valid, save invokes mutation with expected `ItemDraft`, navigates + toasts on success. |
| Modify | `src/router/index.ts` | Re-bind `/inventory/new` from a sheet child to a standalone top-level route. |
| Modify | `src/sheets/ItemSheet.vue` | Drop the create-mode branch so the sheet is edit-only. |

---

## Task 1: `categoryGroups` helper (pure logic)

**Files:**
- Create: `src/lib/categoryGroups.ts`
- Test: `src/lib/categoryGroups.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/categoryGroups.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { groupCategories } from './categoryGroups'
import type { CategoryRow } from '@/lib/types'

const cat = (id: string, name: string): CategoryRow => ({ id, name })

describe('groupCategories', () => {
  it('returns groups in fixed display order: Tops, Bottoms, Base layer', () => {
    const result = groupCategories([
      cat('1', 'Socks'),
      cat('2', 'Normal Pants'),
      cat('3', 'Normal Shirts'),
    ])
    expect(result.map((g) => g.group)).toEqual(['Tops', 'Bottoms', 'Base layer'])
  })

  it('orders categories within a group by the canonical sequence', () => {
    const result = groupCategories([
      cat('a', 'Tank Tops'),
      cat('b', 'Normal Shirts'),
      cat('c', 'Pajama Shirts'),
      cat('d', 'Athletic Shirts'),
      cat('e', 'Church Shirts'),
    ])
    const tops = result.find((g) => g.group === 'Tops')!
    expect(tops.items.map((i) => i.name)).toEqual([
      'Normal Shirts',
      'Church Shirts',
      'Pajama Shirts',
      'Athletic Shirts',
      'Tank Tops',
    ])
  })

  it('routes unknown categories to "Other", placed last', () => {
    const result = groupCategories([
      cat('1', 'Normal Shirts'),
      cat('2', 'Hats'),
    ])
    expect(result.map((g) => g.group)).toEqual(['Tops', 'Other'])
    const other = result.find((g) => g.group === 'Other')!
    expect(other.items.map((i) => i.name)).toEqual(['Hats'])
  })

  it('omits empty groups (no "Other" when all categories map)', () => {
    const result = groupCategories([cat('1', 'Normal Shirts')])
    expect(result.map((g) => g.group)).toEqual(['Tops'])
  })

  it('handles an empty input', () => {
    expect(groupCategories([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/categoryGroups.test.ts`
Expected: FAIL with `Cannot find module './categoryGroups'` (or similar import error).

- [ ] **Step 3: Implement the helper**

Create `src/lib/categoryGroups.ts`:

```ts
// Pure grouping helper for the add-item flow. The mapping is hardcoded
// because the seeded default categories are fixed for this single-user app.
// Any category whose name is not in the mapping falls into "Other" so the
// UI never silently drops unmapped categories.

import type { CategoryRow } from '@/lib/types'

export type CategoryGroup = 'Tops' | 'Bottoms' | 'Base layer' | 'Other'

const GROUP_ORDER: CategoryGroup[] = ['Tops', 'Bottoms', 'Base layer', 'Other']

const MEMBERS: Record<Exclude<CategoryGroup, 'Other'>, string[]> = {
  Tops: [
    'Normal Shirts',
    'Church Shirts',
    'Pajama Shirts',
    'Athletic Shirts',
    'Tank Tops',
  ],
  Bottoms: ['Normal Pants', 'Church Pants', 'Pajama Pants', 'Athletic Shorts'],
  'Base layer': ['Undershirts', 'Socks', 'Underwear'],
}

function groupOf(name: string): CategoryGroup {
  for (const group of ['Tops', 'Bottoms', 'Base layer'] as const) {
    if (MEMBERS[group].includes(name)) return group
  }
  return 'Other'
}

function memberOrderIndex(group: CategoryGroup, name: string): number {
  if (group === 'Other') return 0
  const idx = MEMBERS[group].indexOf(name)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

export interface GroupedCategories {
  group: CategoryGroup
  items: CategoryRow[]
}

export function groupCategories(
  categories: CategoryRow[],
): GroupedCategories[] {
  const buckets = new Map<CategoryGroup, CategoryRow[]>()
  for (const cat of categories) {
    const group = groupOf(cat.name)
    const arr = buckets.get(group) ?? []
    arr.push(cat)
    buckets.set(group, arr)
  }
  return GROUP_ORDER.flatMap((group) => {
    const items = buckets.get(group)
    if (!items || items.length === 0) return []
    const sorted = [...items].sort(
      (a, b) => memberOrderIndex(group, a.name) - memberOrderIndex(group, b.name),
    )
    return [{ group, items: sorted }]
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/categoryGroups.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/categoryGroups.ts src/lib/categoryGroups.test.ts
git commit -m "Add categoryGroups helper for the add-item flow"
```

---

## Task 2: `GroupedCategoryPicker` component

**Files:**
- Create: `src/components/GroupedCategoryPicker.vue`
- Test: `src/components/GroupedCategoryPicker.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/GroupedCategoryPicker.test.ts`:

```ts
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
  it('renders one labelled section per non-empty group', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    const labels = wrapper.findAll('[data-group-label]').map((n) => n.text())
    expect(labels).toEqual(['Tops', 'Bottoms', 'Base layer'])
  })

  it('marks selected chips with the "on" class', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 'b1'], options: OPTIONS },
    })
    expect(wrapper.get('[data-cat-id="t1"]').classes()).toContain('on')
    expect(wrapper.get('[data-cat-id="t2"]').classes()).not.toContain('on')
    expect(wrapper.get('[data-cat-id="b1"]').classes()).toContain('on')
  })

  it('emits update:modelValue with the id added when toggling unselected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1'], options: OPTIONS },
    })
    await wrapper.get('[data-cat-id="s1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![0][0]).toEqual(['t1', 's1'])
  })

  it('emits update:modelValue with the id removed when toggling selected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 'b1'], options: OPTIONS },
    })
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits![0][0]).toEqual(['b1'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/GroupedCategoryPicker.test.ts`
Expected: FAIL with `Cannot find module './GroupedCategoryPicker.vue'` (or similar).

- [ ] **Step 3: Implement the component**

Create `src/components/GroupedCategoryPicker.vue`:

```vue
<script setup lang="ts">
// Multi-select grid for the add-item flow. Categories are split into
// garment-type groups by the pure helper; this component is purely
// presentational and emits id-array changes upstream.
import { computed } from 'vue'
import type { CategoryRow } from '@/lib/types'
import { groupCategories } from '@/lib/categoryGroups'

const props = defineProps<{
  modelValue: string[]
  options: CategoryRow[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const groups = computed(() => groupCategories(props.options))

function toggle(id: string) {
  const set = new Set(props.modelValue)
  set.has(id) ? set.delete(id) : set.add(id)
  emit('update:modelValue', [...set])
}
</script>

<template>
  <div class="picker">
    <div v-for="g in groups" :key="g.group" class="group">
      <div class="group-label" data-group-label>{{ g.group }}</div>
      <div class="grid">
        <button
          v-for="c in g.items"
          :key="c.id"
          type="button"
          class="chip"
          :class="{ on: modelValue.includes(c.id) }"
          :data-cat-id="c.id"
          @click="toggle(c.id)"
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
.group-label {
  font-size: 0.72rem;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
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
  border-radius: 10px;
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/GroupedCategoryPicker.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/GroupedCategoryPicker.vue src/components/GroupedCategoryPicker.test.ts
git commit -m "Add GroupedCategoryPicker for the add-item flow"
```

---

## Task 3: `LocationField` component

**Files:**
- Create: `src/components/LocationField.vue`
- Test: `src/components/LocationField.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/LocationField.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationField from './LocationField.vue'

describe('LocationField', () => {
  it('marks House A as selected when modelValue is "A"', () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    expect(wrapper.get('[data-house="A"]').classes()).toContain('on')
    expect(wrapper.get('[data-house="B"]').classes()).not.toContain('on')
    expect(wrapper.get('[data-house="transit"]').classes()).not.toContain('on')
  })

  it('marks transit as selected when modelValue is "transit"', () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'transit' } })
    expect(wrapper.get('[data-house="transit"]').classes()).toContain('on')
    expect(wrapper.get('[data-house="A"]').classes()).not.toContain('on')
  })

  it('emits update:modelValue with "B" when House B is clicked', async () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    await wrapper.get('[data-house="B"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('B')
  })

  it('emits update:modelValue with "transit" when the transit link is clicked', async () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    await wrapper.get('[data-house="transit"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('transit')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/LocationField.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

Create `src/components/LocationField.vue`:

```vue
<script setup lang="ts">
// A/B selection with the "in transit" option de-emphasized as a small text
// link beneath. Rarity is signalled by geometry, not by hiding behind a menu.
import type { House } from '@/lib/types'

defineProps<{ modelValue: House }>()
const emit = defineEmits<{ 'update:modelValue': [House] }>()
</script>

<template>
  <div class="location">
    <div class="primary">
      <button
        type="button"
        :class="['house', { on: modelValue === 'A' }]"
        :data-house="'A'"
        @click="emit('update:modelValue', 'A')"
      >
        House A
      </button>
      <button
        type="button"
        :class="['house', { on: modelValue === 'B' }]"
        :data-house="'B'"
        @click="emit('update:modelValue', 'B')"
      >
        House B
      </button>
    </div>
    <button
      type="button"
      :class="['transit', { on: modelValue === 'transit' }]"
      :data-house="'transit'"
      @click="emit('update:modelValue', 'transit')"
    >
      in transit
    </button>
  </div>
</template>

<style scoped>
.location {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.primary {
  display: flex;
  gap: 8px;
  width: 100%;
}
.house {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  color: var(--ink-soft);
  font-size: 0.92rem;
  min-height: var(--tap);
}
.house.on {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.transit {
  border: none;
  background: none;
  padding: 4px 4px;
  font-size: 0.82rem;
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.transit.on {
  color: var(--ink);
  font-weight: 500;
}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/LocationField.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/LocationField.vue src/components/LocationField.test.ts
git commit -m "Add LocationField with de-emphasized transit affordance"
```

---

## Task 4: `NewItemView` (full-screen add page)

**Files:**
- Create: `src/views/NewItemView.vue`
- Test: `src/views/NewItemView.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/views/NewItemView.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  createItem: vi.fn(),
  replace: vi.fn(),
  pushToast: vi.fn(),
}))

vi.mock('@/queries', async () => {
  const { ref } = await import('vue')
  const categoriesRef = ref([
    { id: 'c-shirt', name: 'Normal Shirts' },
    { id: 'c-pants', name: 'Normal Pants' },
  ])
  return {
    useCategories: () => ({ data: categoriesRef }),
    useCreateItem: () => ({ mutateAsync: mocks.createItem }),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({ pushToast: mocks.pushToast }),
}))

import NewItemView from './NewItemView.vue'

describe('NewItemView', () => {
  beforeEach(() => {
    mocks.createItem.mockReset().mockResolvedValue(undefined)
    mocks.replace.mockReset()
    mocks.pushToast.mockReset()
  })

  it('disables Save until name and at least one category are present', async () => {
    const wrapper = mount(NewItemView)
    const saveBtn = () => wrapper.get('[data-test="save"]')

    expect(saveBtn().attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="name"]').setValue('Blue Oxford')
    expect(saveBtn().attributes('disabled')).toBeDefined()

    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    expect(saveBtn().attributes('disabled')).toBeUndefined()
  })

  it('clamps the wear-limit decrement at 1', async () => {
    const wrapper = mount(NewItemView)
    const value = () => wrapper.get('[data-test="wear-value"]').text()
    const dec = () => wrapper.get('[data-test="wear-dec"]')

    expect(value()).toContain('2')
    await dec().trigger('click')
    expect(value()).toContain('1')
    await dec().trigger('click')
    expect(value()).toContain('1')
    expect(dec().attributes('disabled')).toBeDefined()
  })

  it('calls createItem with the trimmed draft and navigates + toasts on success', async () => {
    const wrapper = mount(NewItemView)
    await wrapper.get('[data-test="name"]').setValue('  Blue Oxford  ')
    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    await wrapper.get('[data-house="B"]').trigger('click')
    await wrapper.get('[data-test="wear-inc"]').trigger('click') // 2 -> 3

    await wrapper.get('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mocks.createItem).toHaveBeenCalledTimes(1)
    expect(mocks.createItem).toHaveBeenCalledWith({
      name: 'Blue Oxford',
      categoryIds: ['c-shirt'],
      house: 'B',
      wearLimit: 3,
    })
    expect(mocks.replace).toHaveBeenCalledWith('/inventory')
    expect(mocks.pushToast).toHaveBeenCalledWith('Blue Oxford added')
  })

  it('toasts an error message and stays on the page when createItem rejects', async () => {
    mocks.createItem.mockRejectedValueOnce(new Error('Network down'))
    const wrapper = mount(NewItemView)
    await wrapper.get('[data-test="name"]').setValue('Tee')
    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    await wrapper.get('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mocks.pushToast).toHaveBeenCalledWith('Couldn’t save: Network down')
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/NewItemView.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the view**

Create `src/views/NewItemView.vue`:

```vue
<script setup lang="ts">
// Full-screen page for adding a new article of clothing. Owns the form state,
// composes the grouped category picker + location field, and commits via the
// existing useCreateItem mutation. After a successful save, navigates to the
// inventory list (where the new item will appear) and pushes a toast.

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategories, useCreateItem } from '@/queries'
import { useUiStore } from '@/stores/ui'
import type { House, ItemDraft } from '@/lib/types'
import Field from '@/components/Field.vue'
import GroupedCategoryPicker from '@/components/GroupedCategoryPicker.vue'
import LocationField from '@/components/LocationField.vue'

const router = useRouter()
const ui = useUiStore()
const { data: categories } = useCategories()
const createItem = useCreateItem()

const name = ref('')
const categoryIds = ref<string[]>([])
const house = ref<House>('A')
const wearLimit = ref(2)
const saving = ref(false)

const options = computed(() => categories.value ?? [])
const canSave = computed(
  () => name.value.trim().length > 0 && categoryIds.value.length > 0,
)

function decWear() {
  if (wearLimit.value > 1) wearLimit.value -= 1
}
function incWear() {
  wearLimit.value += 1
}

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  const trimmed = name.value.trim()
  const draft: ItemDraft = {
    name: trimmed,
    categoryIds: categoryIds.value,
    house: house.value,
    wearLimit: wearLimit.value,
  }
  try {
    await createItem.mutateAsync(draft)
    ui.pushToast(`${trimmed} added`)
    router.replace('/inventory')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    ui.pushToast(`Couldn’t save: ${message}`)
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.replace('/inventory')
}
</script>

<template>
  <div class="scroll">
    <div class="head">
      <button class="link" @click="cancel">Cancel</button>
      <h2>New item</h2>
      <button
        class="link primary"
        :disabled="!canSave || saving"
        data-test="save"
        @click="save"
      >
        Save
      </button>
    </div>

    <Field label="Name">
      <input
        v-model="name"
        class="input"
        placeholder="e.g. Blue Oxford"
        data-test="name"
        autofocus
      />
    </Field>

    <Field label="Categories">
      <GroupedCategoryPicker v-model="categoryIds" :options="options" />
    </Field>

    <Field label="Location">
      <LocationField v-model="house" />
    </Field>

    <Field label="Wear limit">
      <div class="stepper">
        <button
          type="button"
          :disabled="wearLimit <= 1"
          data-test="wear-dec"
          @click="decWear"
        >
          &minus;
        </button>
        <span data-test="wear-value">
          {{ wearLimit }} wear{{ wearLimit === 1 ? '' : 's' }}
        </span>
        <button type="button" data-test="wear-inc" @click="incWear">+</button>
      </div>
    </Field>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 16px;
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 1;
}
.head h2 {
  font-size: 1.05rem;
}
.link {
  border: none;
  background: none;
  color: var(--ink-soft);
  font-size: 0.92rem;
  padding: 6px 0;
  min-height: var(--tap);
}
.link.primary {
  color: var(--ink);
  font-weight: 600;
}
.link[disabled] {
  color: var(--line);
  font-weight: 400;
  cursor: not-allowed;
}
.input {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 12px 14px;
  width: 100%;
  min-height: var(--tap);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stepper button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 1.2rem;
}
.stepper button[disabled] {
  color: var(--line);
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/views/NewItemView.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/views/NewItemView.vue src/views/NewItemView.test.ts
git commit -m "Add NewItemView full-screen add-item page"
```

---

## Task 5: Promote `/inventory/new` to a standalone route

**Files:**
- Modify: `src/router/index.ts`

The current `item-new` route mounts `InventoryView` underneath an `ItemSheet` overlay. After this change, `/inventory/new` is its own top-level view (no inventory render-behind, no sheet). Edit (`/inventory/:id`) is unchanged.

- [ ] **Step 1: Update the router**

Replace the contents of `src/router/index.ts` with:

```ts
// Minimal router: two tab routes + edit-as-sheet. The add-item flow is a
// standalone full-screen route (not a sheet), since it's a deliberate piece
// of work and warrants the heavier container.

import { createRouter, createWebHistory } from 'vue-router'
import InventoryView from '@/views/InventoryView.vue'
import NewItemView from '@/views/NewItemView.vue'
import StatusView from '@/views/StatusView.vue'
import ItemSheet from '@/sheets/ItemSheet.vue'
import LaundrySheet from '@/sheets/LaundrySheet.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/inventory' },
    {
      path: '/inventory',
      name: 'inventory',
      components: { default: InventoryView },
    },
    {
      path: '/inventory/new',
      name: 'item-new',
      components: { default: NewItemView },
    },
    {
      path: '/inventory/:id',
      name: 'item-edit',
      components: { default: InventoryView, sheet: ItemSheet },
      props: { sheet: true },
    },
    {
      path: '/status',
      name: 'status',
      components: { default: StatusView },
    },
    {
      path: '/status/laundry',
      name: 'laundry',
      components: { default: StatusView, sheet: LaundrySheet },
    },
  ],
})
```

- [ ] **Step 2: Verify the existing test suite still passes**

Run: `npm test`
Expected: PASS for all (engine tests + the three new test files).

- [ ] **Step 3: Verify typecheck still passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts
git commit -m "Promote /inventory/new from sheet child to standalone route"
```

---

## Task 6: Strip create-mode dead code from `ItemSheet`

`ItemSheet.vue` is now reached only via `/inventory/:id` (edit). Simplify its
script and template to drop the create branch so its responsibility is clear.

**Files:**
- Modify: `src/sheets/ItemSheet.vue`

- [ ] **Step 1: Apply the simplifications**

Replace the contents of `src/sheets/ItemSheet.vue` with:

```vue
<script setup lang="ts">
// Edit-only sheet for an existing item. Add-item lives at /inventory/new
// as a standalone full-screen page.
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import {
  useItems,
  useCategories,
  useUpdateItem,
  useDeleteItem,
  useMarkClean,
  useMarkDirty,
} from '@/queries'
import { useUiStore } from '@/stores/ui'
import { isClean, type AppItem, type House, type ItemDraft } from '@/lib/types'
import Field from '@/components/Field.vue'
import CategoryPicker from '@/components/CategoryPicker.vue'

const emit = defineEmits<{ close: [] }>()
const route = useRoute()
const ui = useUiStore()

const { data: items } = useItems()
const { data: categories } = useCategories()
const updateItem = useUpdateItem()
const deleteItem = useDeleteItem()
const markClean = useMarkClean()
const markDirty = useMarkDirty()

const id = computed(() => String(route.params.id))
const existing = computed<AppItem | undefined>(() =>
  items.value?.find((i) => i.id === id.value),
)

const name = ref('')
const house = ref<House>(ui.currentHouse)
const wearLimit = ref(2)
const categoryIds = ref<string[]>([])

watchEffect(() => {
  const e = existing.value
  if (e) {
    name.value = e.name
    house.value = e.house
    wearLimit.value = e.wearLimit
    categoryIds.value = [...e.categoryIds]
  }
})

const draft = computed<ItemDraft>(() => ({
  name: name.value.trim(),
  house: house.value,
  wearLimit: wearLimit.value,
  categoryIds: categoryIds.value,
}))
const canSave = computed(() => draft.value.name.length > 0)

async function save() {
  if (!canSave.value) return
  await updateItem.mutateAsync({ id: id.value, draft: draft.value })
  emit('close')
}
async function remove() {
  if (!confirm(`Delete "${name.value}"?`)) return
  await deleteItem.mutateAsync(id.value)
  emit('close')
}
async function toggleDirty() {
  const e = existing.value
  if (!e) return
  if (isClean(e)) await markDirty.mutateAsync({ id: e.id, wearLimit: e.wearLimit })
  else await markClean.mutateAsync(e.id)
}
</script>

<template>
  <div class="sheet">
    <div class="grab" />
    <div class="head">
      <h2>Edit item</h2>
      <button class="x" @click="emit('close')">Done</button>
    </div>

    <Field label="Name">
      <input v-model="name" class="input" placeholder="e.g. Blue Oxford" />
    </Field>

    <Field label="Categories">
      <CategoryPicker
        v-model="categoryIds"
        :options="categories ?? []"
      />
    </Field>

    <Field label="Location">
      <div class="seg">
        <button
          v-for="h in (['A', 'B', 'transit'] as House[])"
          :key="h"
          type="button"
          :class="{ on: house === h }"
          @click="house = h"
        >
          {{ h === 'transit' ? 'In transit' : `House ${h}` }}
        </button>
      </div>
    </Field>

    <Field label="Wear limit">
      <div class="stepper">
        <button @click="wearLimit = Math.max(1, wearLimit - 1)">−</button>
        <span>{{ wearLimit }} wear{{ wearLimit === 1 ? '' : 's' }}</span>
        <button @click="wearLimit++">+</button>
      </div>
    </Field>

    <button v-if="existing" class="btn linkish" @click="toggleDirty">
      {{ isClean(existing) ? 'Mark dirty' : 'Mark clean' }}
    </button>

    <button class="btn btn-primary save" :disabled="!canSave" @click="save">
      Save changes
    </button>

    <button class="btn delete" @click="remove">Delete item</button>
  </div>
</template>

<style scoped>
.sheet {
  padding-bottom: 8px;
}
.grab {
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  margin: 6px auto 10px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.x {
  border: none;
  background: none;
  color: var(--ink-soft);
}
.input {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 12px 14px;
  width: 100%;
  min-height: var(--tap);
}
.seg {
  display: flex;
  gap: 8px;
}
.seg button {
  flex: 1;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 10px 0;
  color: var(--ink-soft);
}
.seg button.on {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stepper button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 1.2rem;
}
.linkish {
  width: 100%;
  margin-bottom: 10px;
}
.save {
  width: 100%;
}
.delete {
  width: 100%;
  margin-top: 10px;
  color: var(--accent);
  border-color: var(--accent);
  background: transparent;
}
</style>
```

- [ ] **Step 2: Verify the full test suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/sheets/ItemSheet.vue
git commit -m "Drop create-mode dead branch from ItemSheet (edit-only)"
```

---

## Task 7: Manual browser verification

The unit and component tests cover the seams; this task verifies the integrated
flow against the real Supabase backend. Skip Supabase auth-related steps if
`.env.local` isn't populated — note the limitation in the next step's commit
instead.

- [ ] **Step 1: Run the dev server**

Run: `npm run dev`
Expected: Vite reports a local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Verify the golden path**

In a browser, open the URL and sign in. Then:

1. From the Inventory tab, tap the `+` FAB → the URL becomes `/inventory/new` and a full-screen page renders (no inventory visible behind).
2. Confirm Save is disabled.
3. Type "Blue Oxford" in Name → Save still disabled.
4. Tap "Normal Shirts" in the category grid → Save enables.
5. Tap "House B" → House B becomes the highlighted primary.
6. Tap "in transit" → the small text affordance picks up the selected state.
7. Tap "House A" → returns to House A.
8. Tap the wear-limit `−` button → goes to 1 and `−` disables.
9. Tap `+` twice → 3 wears.
10. Tap Save → returns to `/inventory`, a toast reads `Blue Oxford added`, and the new item appears in the Normal Shirts group.

- [ ] **Step 3: Verify edge cases**

1. Open `/inventory/new`, type a name with leading/trailing spaces ("  Tee  "), pick a category, Save → the saved name is trimmed (verify in the inventory row).
2. Tap Cancel → returns to `/inventory` without saving.
3. Open `/inventory/new`, fill in valid data, then disconnect the network (devtools "Offline") and tap Save → a toast reads `Couldn't save: <message>` and the form stays populated.
4. Open `/inventory/<some-id>` for an existing item → the edit sheet renders as before (regression check). Header reads "Edit item"; Save button reads "Save changes". Delete button is present.

- [ ] **Step 4: Final commit if any tweaks were needed**

If any manual fix was required during verification, commit it now. Otherwise no commit needed.

```bash
# Only if needed
git add <changed files>
git commit -m "Manual verification fixes for add-inventory flow"
```

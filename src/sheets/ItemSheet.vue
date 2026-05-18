<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import {
  useItems,
  useCategories,
  useCreateItem,
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
const createItem = useCreateItem()
const updateItem = useUpdateItem()
const deleteItem = useDeleteItem()
const markClean = useMarkClean()
const markDirty = useMarkDirty()

const id = computed(() =>
  route.name === 'item-edit' ? String(route.params.id) : null,
)
const existing = computed<AppItem | undefined>(() =>
  id.value ? items.value?.find((i) => i.id === id.value) : undefined,
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
  if (id.value) await updateItem.mutateAsync({ id: id.value, draft: draft.value })
  else await createItem.mutateAsync(draft.value)
  emit('close')
}
async function remove() {
  if (!id.value) return
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
      <h2>{{ id ? 'Edit item' : 'New item' }}</h2>
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
      {{ id ? 'Save changes' : 'Add item' }}
    </button>

    <button v-if="id" class="btn delete" @click="remove">Delete item</button>
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

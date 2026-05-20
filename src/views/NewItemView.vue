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
          @click.stop="decWear"
        >
          &minus;
        </button>
        <span data-test="wear-value">
          {{ wearLimit }} wear{{ wearLimit === 1 ? '' : 's' }}
        </span>
        <button type="button" data-test="wear-inc" @click.stop="incWear">+</button>
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

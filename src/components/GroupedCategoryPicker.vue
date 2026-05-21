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

function changeGroup() {
  emit('update:modelValue', [])
  selectedGroup.value = null
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
      <div class="change-row" data-test="change-row">
        <span class="group-name">{{ selectedGroup }}</span>
        <button
          type="button"
          class="change-link"
          data-test="change-group"
          aria-label="Change group"
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
</style>

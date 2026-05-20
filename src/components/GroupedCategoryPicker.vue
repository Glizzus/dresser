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

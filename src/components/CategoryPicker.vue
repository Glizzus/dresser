<script setup lang="ts">
import type { CategoryRow } from '@/lib/types'

const props = defineProps<{
  modelValue: string[]
  options: CategoryRow[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

function toggle(id: string) {
  const set = new Set(props.modelValue)
  set.has(id) ? set.delete(id) : set.add(id)
  emit('update:modelValue', [...set])
}
</script>

<template>
  <div class="chips">
    <button
      v-for="c in options"
      :key="c.id"
      type="button"
      class="chip"
      :class="{ on: modelValue.includes(c.id) }"
      @click="toggle(c.id)"
    >
      {{ c.name }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 0.88rem;
  color: var(--ink-soft);
}
.chip.on {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
</style>

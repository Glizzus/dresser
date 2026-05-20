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

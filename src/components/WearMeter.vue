<script setup lang="ts">
// Tiny row of dots + a plain-language label. Replaces any ambiguous
// "0/2" fraction. Accent red is used ONLY for the dirty state.
import { computed } from 'vue'

const props = defineProps<{ wears: number; wearLimit: number }>()

const dirty = computed(() => props.wears >= props.wearLimit)
const dots = computed(() =>
  Array.from({ length: props.wearLimit }, (_, i) => i < props.wears),
)
const label = computed(() => {
  if (dirty.value) return 'dirty'
  if (props.wears === 0) return 'fresh'
  const left = props.wearLimit - props.wears
  return `${left} wear${left === 1 ? '' : 's'} left`
})
</script>

<template>
  <span class="meter" :class="{ dirty }">
    <span class="dots">
      <span
        v-for="(used, i) in dots"
        :key="i"
        class="dot"
        :class="{ used }"
      />
    </span>
    <span class="lbl">{{ label }}</span>
  </span>
</template>

<style scoped>
.meter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dots {
  display: inline-flex;
  gap: 3px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--ink-soft);
}
.dot.used {
  background: var(--ink-soft);
}
.dirty .dot {
  border-color: var(--accent);
}
.dirty .dot.used {
  background: var(--accent);
}
.lbl {
  font-size: 0.8rem;
  color: var(--ink-soft);
}
.dirty .lbl {
  color: var(--accent);
}
</style>

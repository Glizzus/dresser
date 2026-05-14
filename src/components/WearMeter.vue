<script setup lang="ts">
import { computed } from 'vue'
import { T } from '../lib/tokens'

const props = withDefaults(
  defineProps<{
    wears: number
    lim: number
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const ratio = computed(() => props.wears / props.lim)
const dirty = computed(() => props.wears >= props.lim)
const warn = computed(() => !dirty.value && ratio.value >= 0.5)

const cellW = computed(() => (props.size === 'sm' ? 5 : 6))
const cellH = computed(() => (props.size === 'sm' ? 16 : 22))

const cells = computed(() =>
  Array.from({ length: props.lim }, (_, i) => i < props.wears),
)

const label = computed(() => {
  if (dirty.value) return 'dirty'
  if (props.wears === 0) return 'fresh'
  return `${props.lim - props.wears} left`
})

const cellColor = (filled: boolean) => {
  if (!filled) return T.ring
  if (dirty.value) return T.warn
  if (warn.value) return T.dirty
  return T.ink
}
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
    }"
  >
    <div :style="{ display: 'flex', gap: '2px' }">
      <div
        v-for="(filled, i) in cells"
        :key="i"
        :style="{
          width: `${cellW}px`,
          height: `${cellH}px`,
          borderRadius: '1.5px',
          background: cellColor(filled),
        }"
      />
    </div>
    <div
      :style="{
        fontSize: '10px',
        color: dirty ? T.warn : T.sub,
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
      }"
    >
      {{ label }}
    </div>
  </div>
</template>

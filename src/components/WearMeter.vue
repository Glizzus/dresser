<script setup lang="ts">
import { computed } from 'vue'

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

const cells = computed(() =>
  Array.from({ length: props.lim }, (_, i) => i < props.wears),
)

const label = computed(() => {
  if (dirty.value) return 'dirty'
  if (props.wears === 0) return 'fresh'
  return `${props.lim - props.wears} left`
})

const cellClass = (filled: boolean) => {
  if (!filled) return null
  if (dirty.value) return 'wt-meter__cell--dirty'
  if (warn.value) return 'wt-meter__cell--warn'
  return 'wt-meter__cell--filled'
}
</script>

<template>
  <div class="wt-meter" :class="size === 'sm' && 'wt-meter--sm'">
    <div class="wt-meter__cells">
      <div
        v-for="(filled, i) in cells"
        :key="i"
        class="wt-meter__cell"
        :class="cellClass(filled)"
      />
    </div>
    <div class="wt-meter__label" :class="dirty && 'wt-meter__label--dirty'">
      {{ label }}
    </div>
  </div>
</template>

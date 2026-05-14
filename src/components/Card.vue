<script setup lang="ts">
import { computed, type StyleValue } from 'vue'
import PCard from 'primevue/card'
import { T } from '../lib/tokens'

const props = withDefaults(
  defineProps<{
    padding?: number | string
    style?: StyleValue
  }>(),
  { padding: 0 },
)

const padding = computed(() =>
  typeof props.padding === 'number' ? `${props.padding}px` : props.padding,
)
</script>

<template>
  <PCard
    :style="props.style"
    :pt="{
      root: {
        style: {
          background: T.surface,
          borderRadius: '16px',
          boxShadow: `0 0 0 0.5px ${T.div}, 0 1px 2px rgba(20,20,28,0.04)`,
          overflow: 'hidden',
        },
      },
      body: { style: { padding } },
      content: { style: { padding: 0 } },
    }"
  >
    <template #content>
      <slot />
    </template>
  </PCard>
</template>

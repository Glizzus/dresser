<script setup lang="ts">
withDefaults(
  defineProps<{
    inset?: boolean
    pad?: 12 | 14 | 16 | 0
    variant?: 'plain' | 'ok' | 'warn'
  }>(),
  { inset: false, pad: 0, variant: 'plain' },
)
</script>

<template>
  <div
    class="wt-card"
    :class="[
      inset && 'wt-card--inset',
      pad === 12 && 'wt-card--pad-12',
      pad === 14 && 'wt-card--pad-14',
      pad === 16 && 'wt-card--pad-16',
      variant === 'ok' && 'wt-card--ok',
      variant === 'warn' && 'wt-card--warn',
    ]"
  >
    <slot />
  </div>
</template>

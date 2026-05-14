<script setup lang="ts">
import { T } from '../lib/tokens'

defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <div :style="{ marginBottom: '16px' }">
    <div
      :style="{
        fontSize: '11.5px',
        fontWeight: 700,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        color: T.sub,
        marginBottom: '6px',
      }"
    >
      {{ label }}
    </div>
    <slot />
    <div
      v-if="hint"
      :style="{
        fontSize: '12px',
        color: T.sub,
        marginTop: '6px',
        letterSpacing: '-0.1px',
      }"
    >
      {{ hint }}
    </div>
  </div>
</template>

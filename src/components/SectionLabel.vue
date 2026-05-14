<script setup lang="ts">
import { T } from '../lib/tokens'

withDefaults(defineProps<{ inline?: boolean }>(), { inline: false })
</script>

<template>
  <div
    :style="{
      fontSize: '11.5px',
      fontWeight: 700,
      letterSpacing: '0.6px',
      textTransform: 'uppercase',
      color: T.sub,
      padding: inline ? '0' : '4px 16px 0',
    }"
  >
    <slot />
  </div>
</template>

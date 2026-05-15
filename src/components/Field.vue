<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <div class="wt-field">
    <div class="wt-field__label">{{ label }}</div>
    <slot />
    <div v-if="hint" class="wt-field__hint">{{ hint }}</div>
  </div>
</template>

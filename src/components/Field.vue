<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <label class="field">
    <span class="label">{{ label }}</span>
    <slot />
  </label>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.label {
  font-size: 0.8rem;
  color: var(--ink-soft);
}
</style>

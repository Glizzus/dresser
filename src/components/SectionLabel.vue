<script setup lang="ts">
defineProps<{ text: string; count?: number; accent?: boolean }>()
</script>

<template>
  <div class="section">
    <span>{{ text }}</span>
    <span v-if="count !== undefined" class="count" :class="{ accent }">
      {{ count }}
    </span>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin: 18px 2px 8px;
}
.count {
  color: var(--ink-soft);
}
.count.accent {
  color: var(--accent);
  font-weight: 600;
}
</style>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="nav">
    <RouterLink to="/inventory" class="tab" active-class="on">
      <svg viewBox="0 0 24 24" class="ic">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <circle cx="12" cy="8" r="0.6" />
        <circle cx="12" cy="16" r="0.6" />
      </svg>
      <span>Inventory</span>
    </RouterLink>
    <RouterLink to="/status" class="tab" active-class="on">
      <svg viewBox="0 0 24 24" class="ic">
        <path d="M4 13l5 5L20 6" />
      </svg>
      <span>Status</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 0;
  text-decoration: none;
  color: var(--ink-soft);
  font-size: 0.72rem;
}
.tab.on {
  color: var(--ink);
}
.ic {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="fade">
      <button
        v-for="t in ui.toasts"
        :key="t.id"
        class="toast"
        @click="ui.dismissToast(t.id)"
      >
        {{ t.message }}
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(76px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 60;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  background: var(--ink);
  color: var(--bg);
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 0.9rem;
  max-width: 90%;
}
</style>

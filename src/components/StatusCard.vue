<script setup lang="ts">
import type { InvariantResult } from '@/lib/types'
defineProps<{ result: InvariantResult }>()
</script>

<template>
  <div class="card" :class="{ broken: !result.satisfied }">
    <div class="row">
      <span class="label">{{ result.label }}</span>
      <span class="havenel">have {{ result.have }} / need {{ result.need }}</span>
    </div>
    <template v-if="!result.satisfied && result.bottleneck">
      <div class="bottleneck">
        Bottleneck: {{ result.bottleneck.category }}
        (short {{ result.bottleneck.shortfall }})
      </div>
      <div class="fix">{{ result.fix }}</div>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 10px;
}
.card.broken {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.label {
  font-weight: 600;
}
.havenel {
  font-size: 0.82rem;
  color: var(--ink-soft);
  white-space: nowrap;
}
.bottleneck {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--ink-soft);
}
.fix {
  margin-top: 4px;
  font-weight: 600;
  color: var(--accent);
}
</style>

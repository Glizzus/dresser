<script setup lang="ts">
// Manual segmented A / B control with per-house broken-invariant badges.
// Tapping the other house means "I arrived there" — transit items then
// auto-arrive and a dismissible toast reports it.
import { computed } from 'vue'
import { useItems, usePiles, useArriveTransit } from '@/queries'
import { useUiStore } from '@/stores/ui'
import { evaluateStatus } from '@engine/engine.ts'
import { DEFAULT_INVARIANTS } from '@engine/invariants.ts'

const ui = useUiStore()
const { data: items } = useItems()
const { data: piles } = usePiles()
const arrive = useArriveTransit()

function brokenFor(house: 'A' | 'B') {
  return evaluateStatus(
    DEFAULT_INVARIANTS,
    items.value ?? [],
    piles.value ?? [],
    house,
  ).brokenCount
}
const brokenA = computed(() => brokenFor('A'))
const brokenB = computed(() => brokenFor('B'))

async function pick(house: 'A' | 'B') {
  if (house === ui.currentHouse) return
  ui.setHouse(house)
  const moved = await arrive.mutateAsync(house)
  if (moved > 0) {
    ui.pushToast(
      `${moved} item${moved === 1 ? '' : 's'} arrived at House ${house}`,
    )
  }
}
</script>

<template>
  <header class="hdr">
    <div class="seg">
      <button
        class="opt"
        :class="{ on: ui.currentHouse === 'A' }"
        @click="pick('A')"
      >
        House A
        <span v-if="brokenA > 0" class="badge">{{ brokenA }}</span>
      </button>
      <button
        class="opt"
        :class="{ on: ui.currentHouse === 'B' }"
        @click="pick('B')"
      >
        House B
        <span v-if="brokenB > 0" class="badge">{{ brokenB }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  padding: calc(8px + env(safe-area-inset-top)) 16px 8px;
}
.seg {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px;
}
.opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 9px 0;
  color: var(--ink-soft);
  font-weight: 500;
}
.opt.on {
  background: var(--bg);
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.badge {
  background: var(--accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
</style>

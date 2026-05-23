<script setup lang="ts">
// A base-layer pile rendered as an inventory row. Unlike a tracked item, a
// pile has no wears meter — it has a stepper over its CLEAN count and a
// chevron that drills into the total editor.
//
//   [−]  7 / 10  [+]                          >
//        clean    total
//
// Stepping moves one unit between clean and dirty (the total never changes):
//  • [+] makes one more clean  → dirty − 1   (disabled when all are clean)
//  • [−] makes one more dirty  → dirty + 1   (disabled when all are dirty)
// Buying/discarding inventory — changing the TOTAL — happens behind the chevron.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { AppPile } from '@/lib/types'
import { pileClean } from '@/lib/types'
import { useSetPileCounts } from '@/queries'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ pile: AppPile }>()
const router = useRouter()
const ui = useUiStore()
const setCounts = useSetPileCounts()

const clean = computed(() => pileClean(props.pile))
const allClean = computed(() => props.pile.dirty === 0)
const allDirty = computed(() => clean.value === 0)
const empty = computed(() => props.pile.total === 0)

// Each step writes an absolute dirty value derived from the current props. We
// disable both buttons while a write is in flight (busy) so a burst of taps
// can't all read the same stale count — that would silently drop steps, or
// push dirty past total and trip the DB's `dirty <= total` check. On failure
// the count is left untouched server-side; surface it rather than swallow it.
const busy = computed(() => setCounts.isPending.value)

function step(nextDirty: number) {
  setCounts.mutate(
    { id: props.pile.id, patch: { dirty: nextDirty } },
    { onError: () => ui.pushToast(`Couldn't update ${props.pile.kind}`) },
  )
}
function incClean() {
  if (allClean.value || busy.value) return
  step(props.pile.dirty - 1)
}
function decClean() {
  if (allDirty.value || busy.value) return
  step(props.pile.dirty + 1)
}
function editTotal() {
  router.push(`/inventory/pile/${props.pile.id}`)
}
</script>

<template>
  <div class="row">
    <div class="name">{{ pile.kind }}</div>

    <div class="stepper" v-if="!empty">
      <button
        type="button"
        class="step"
        :disabled="allDirty || busy"
        aria-label="One more dirty"
        @click="decClean"
      >
        &minus;
      </button>
      <span class="count">
        <span class="clean" :class="{ low: allDirty }">{{ clean }}</span>
        <span class="sep">/</span>
        <span class="total">{{ pile.total }}</span>
      </span>
      <button
        type="button"
        class="step"
        :disabled="allClean || busy"
        aria-label="One more clean"
        @click="incClean"
      >
        +
      </button>
    </div>

    <button v-else type="button" class="setup" @click="editTotal">
      Set amount
    </button>

    <button
      type="button"
      class="chev"
      aria-label="Change total amount"
      @click="editTotal"
    >
      ›
    </button>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.step {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 1.05rem;
  line-height: 1;
  color: var(--ink);
}
.step[disabled] {
  color: var(--line);
}
.count {
  min-width: 46px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
}
.clean {
  font-weight: 600;
}
.clean.low {
  color: var(--accent);
}
.sep,
.total {
  color: var(--ink-soft);
}
.setup {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.82rem;
  color: var(--ink-soft);
}
.chev {
  border: none;
  background: none;
  color: var(--ink-soft);
  font-size: 1.4rem;
  line-height: 1;
  padding: 0 2px;
  width: 18px;
}
</style>

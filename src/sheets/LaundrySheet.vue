<script setup lang="ts">
// Did-laundry sheet — a per-house action. Shows what will be reset: named
// dirty items grouped by category, plus the dirty count of each base-layer
// pile. Commit resets wears to 0 for dirty items AND clears pile dirty at this
// house, and records a laundry_events row.
import { computed } from 'vue'
import { useItems, usePiles, useDoLaundry } from '@/queries'
import { useUiStore } from '@/stores/ui'
import { evaluateStatus } from '@engine/engine.ts'
import { DEFAULT_INVARIANTS } from '@engine/invariants.ts'

const emit = defineEmits<{ close: [] }>()
const ui = useUiStore()
const { data: items } = useItems()
const { data: piles } = usePiles()
const doLaundry = useDoLaundry()

const house = computed(() => ui.currentHouse)
const hamper = computed(
  () =>
    evaluateStatus(
      DEFAULT_INVARIANTS,
      items.value ?? [],
      piles.value ?? [],
      house.value,
    ).hamper,
)

// Piles aren't in the named hamper (they have no names), so the laundry sheet
// surfaces them itself — otherwise a house with only dirty piles would read
// "nothing to wash" while Status insists the underwear pile is short.
const dirtyPiles = computed(() =>
  (piles.value ?? []).filter((p) => p.house === house.value && p.dirty > 0),
)
const itemCount = computed(() =>
  hamper.value.reduce((n, g) => n + g.items.length, 0),
)
const pileCount = computed(() =>
  dirtyPiles.value.reduce((n, p) => n + p.dirty, 0),
)
const total = computed(() => itemCount.value + pileCount.value)

async function commit() {
  const n = await doLaundry.mutateAsync(house.value)
  ui.pushToast(
    n > 0
      ? `Washed ${n} thing${n === 1 ? '' : 's'} at House ${house.value}`
      : `Nothing to wash at House ${house.value}`,
  )
  emit('close')
}
</script>

<template>
  <div class="sheet">
    <div class="grab" />
    <div class="head">
      <h2>Did laundry · House {{ house }}</h2>
      <button class="x" @click="emit('close')">Cancel</button>
    </div>

    <p v-if="total === 0" class="muted">
      Nothing dirty at House {{ house }}.
    </p>

    <template v-else>
      <p class="muted intro">
        These will be reset to fresh:
      </p>
      <div v-for="g in hamper" :key="g.category" class="grp">
        <div class="cat">{{ g.category }}</div>
        <div class="names">
          {{ g.items.map((i) => i.name).join(', ') }}
        </div>
      </div>
      <div v-for="p in dirtyPiles" :key="p.id" class="grp">
        <div class="cat">{{ p.kind }}</div>
        <div class="names">{{ p.dirty }} dirty</div>
      </div>
    </template>

    <button
      class="btn btn-primary commit"
      :disabled="total === 0 || doLaundry.isPending.value"
      @click="commit"
    >
      Wash {{ total }} thing{{ total === 1 ? '' : 's' }}
    </button>
  </div>
</template>

<style scoped>
.sheet {
  padding-bottom: 8px;
}
.grab {
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  margin: 6px auto 10px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.x {
  border: none;
  background: none;
  color: var(--ink-soft);
}
.intro {
  margin: 0 0 8px;
}
.grp {
  display: flex;
  gap: 10px;
  padding: 8px 2px;
  border-bottom: 1px solid var(--line);
}
.cat {
  font-size: 0.85rem;
  color: var(--ink-soft);
  min-width: 110px;
}
.names {
  flex: 1;
  font-size: 0.9rem;
}
.commit {
  width: 100%;
  margin-top: 20px;
}
</style>

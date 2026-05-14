<script setup lang="ts">
import { computed } from 'vue'
import Card from '../components/Card.vue'
import CTA from '../components/CTA.vue'
import Sheet from '../components/Sheet.vue'
import { HOUSES, atHouse, dirtyAt, invariants, isClean } from '../lib/data'
import { T } from '../lib/tokens'
import type { HouseId, Item } from '../lib/types'

const props = defineProps<{
  items: Item[]
  house: HouseId
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const dirty = computed(() => dirtyAt(props.items, props.house))
const before = computed(() => invariants(props.items, props.house))
const after = computed(() =>
  invariants(
    props.items.map((it) =>
      atHouse(it, props.house) && !isClean(it) ? { ...it, w: 0 } : it,
    ),
    props.house,
  ),
)
const brokenBefore = computed(
  () => before.value.filter((i) => i.severity === 'broken').length,
)
const brokenAfter = computed(
  () => after.value.filter((i) => i.severity === 'broken').length,
)
const fixed = computed(() => brokenBefore.value - brokenAfter.value)

const groups = computed(() => {
  const g: Record<string, Item[]> = {}
  for (const it of dirty.value) {
    const c = it.cats[0]
    if (!g[c]) g[c] = []
    g[c].push(it)
  }
  return Object.entries(g)
})
</script>

<template>
  <Sheet @close="emit('close')">
    <div :style="{ padding: '8px 20px 0' }">
      <div :style="{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px' }">
        Did laundry?
      </div>
      <div :style="{ fontSize: '14px', color: T.sub, marginTop: '4px' }">
        All dirty items at {{ HOUSES[house].name }} → clean.
      </div>
    </div>

    <div
      class="wt-scroll"
      :style="{ flex: 1, overflowY: 'auto', padding: '14px 16px 0' }"
    >
      <Card :padding="14" :style="{ marginBottom: '10px' }">
        <div
          :style="{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }"
        >
          <div :style="{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }">
            {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }}
          </div>
          <div
            :style="{
              fontSize: '12.5px',
              color: T.sub,
              fontWeight: 600,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }"
          >hamper</div>
        </div>
        <div :style="{ marginTop: '10px' }">
          <div
            v-for="[c, list] in groups"
            :key="c"
            :style="{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderTop: `0.5px solid ${T.div}`,
              fontSize: '14px',
            }"
          >
            <span :style="{ color: T.ink2 }">{{ c }}</span>
            <span :style="{ color: T.sub, fontVariantNumeric: 'tabular-nums' }">
              {{ list.length }}
            </span>
          </div>
        </div>
      </Card>

      <Card
        v-if="fixed > 0"
        :padding="12"
        :style="{ background: T.okBg, boxShadow: 'none', marginBottom: '10px' }"
      >
        <div
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: T.ok,
            fontSize: '14px',
            fontWeight: 600,
          }"
        >
          <span
            :style="{
              width: '22px',
              height: '22px',
              borderRadius: '999px',
              background: T.ok,
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
            }"
          >✓</span>
          Fixes {{ fixed }} broken invariant{{ fixed === 1 ? '' : 's' }}
        </div>
      </Card>

      <Card
        v-if="dirty.length === 0"
        :padding="20"
        :style="{ marginBottom: '10px', textAlign: 'center' }"
      >
        <div :style="{ fontSize: '15px', color: T.sub }">
          No dirty items here. Nothing to wash.
        </div>
      </Card>
    </div>

    <div :style="{ padding: '12px 16px calc(env(safe-area-inset-bottom) + 16px)' }">
      <CTA :disabled="dirty.length === 0" @press="emit('confirm')">
        Confirm · {{ dirty.length }} clean
      </CTA>
      <div :style="{ height: '8px' }" />
      <CTA kind="ghost" @press="emit('close')">Cancel</CTA>
    </div>
  </Sheet>
</template>

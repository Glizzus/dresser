<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Card from '../components/Card.vue'
import { HOUSES, atHouse, dirtyAt, invariants, isClean } from '../lib/data'
import type { HouseId, Item } from '../lib/types'

const props = defineProps<{
  items: Item[]
  house: HouseId
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const visible = ref(true)
watch(visible, (v) => {
  if (!v) emit('close')
})

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
  <Drawer v-model:visible="visible" position="bottom" class="wt-drawer">
    <div class="wt-laundry-head">
      <div class="wt-laundry-headline">Did laundry?</div>
      <div class="wt-sheet-subtitle">
        All dirty items at {{ HOUSES[house].name }} → clean.
      </div>
    </div>

    <div class="wt-scroll wt-laundry-scroll">
      <Card :pad="14" class="wt-laundry-card">
        <div class="wt-status-row">
          <div class="wt-laundry-headline">
            {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }}
          </div>
          <div class="wt-laundry-label">hamper</div>
        </div>
        <div class="wt-inv-group__body">
          <div
            v-for="[c, list] in groups"
            :key="c"
            class="wt-laundry-breakdown"
          >
            <span class="wt-laundry-breakdown__cat">{{ c }}</span>
            <span class="wt-laundry-breakdown__ct">{{ list.length }}</span>
          </div>
        </div>
      </Card>

      <Card v-if="fixed > 0" :pad="12" variant="ok" class="wt-laundry-card">
        <div class="wt-laundry-fixed">
          <span class="wt-laundry-fixed__dot">✓</span>
          Fixes {{ fixed }} broken invariant{{ fixed === 1 ? '' : 's' }}
        </div>
      </Card>

      <Card v-if="dirty.length === 0" :pad="16" class="wt-laundry-card">
        <div class="wt-laundry-empty">No dirty items here. Nothing to wash.</div>
      </Card>
    </div>

    <div class="wt-sheet-foot">
      <Button
        fluid
        size="large"
        severity="contrast"
        :disabled="dirty.length === 0"
        :label="`Confirm · ${dirty.length} clean`"
        @click="emit('confirm')"
      />
      <Button
        fluid
        size="large"
        severity="secondary"
        variant="outlined"
        label="Cancel"
        @click="visible = false"
      />
    </div>
  </Drawer>
</template>

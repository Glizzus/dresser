<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from '../components/Card.vue'
import Header from '../components/Header.vue'
import ItemRow, { type SwipeAction } from '../components/ItemRow.vue'
import SectionLabel from '../components/SectionLabel.vue'
import WearMeter from '../components/WearMeter.vue'
import { CATEGORIES, atHouse, isClean } from '../lib/data'
import type { HouseId, HouseSummary, Item } from '../lib/types'

const props = defineProps<{
  items: Item[]
  house: HouseId
  summaries: Record<HouseId, HouseSummary>
}>()

const emit = defineEmits<{
  switchHouse: [h: HouseId]
  markDirty: [id: string]
  markClean: [id: string]
  move: [id: string, to: HouseId]
  openItem: [it: Item]
  openAdd: []
}>()

type Filter = 'all' | 'clean' | 'dirty' | string
const filter = ref<Filter>('all')

const pool = computed(() => {
  let p = props.items.filter((i) => atHouse(i, props.house))
  if (filter.value === 'clean') p = p.filter(isClean)
  else if (filter.value === 'dirty') p = p.filter((i) => !isClean(i))
  else if (filter.value !== 'all') p = p.filter((i) => i.cats.includes(filter.value))
  return p
})

const groups = computed(() => {
  const g: Record<string, Item[]> = {}
  for (const it of pool.value) {
    const c = it.cats[0]
    if (!g[c]) g[c] = []
    g[c].push(it)
  }
  return g
})

const catOrder = computed(() => CATEGORIES.filter((c) => groups.value[c]))

const totalClean = computed(
  () => props.items.filter((i) => atHouse(i, props.house) && isClean(i)).length,
)
const totalDirty = computed(
  () => props.items.filter((i) => atHouse(i, props.house) && !isClean(i)).length,
)

const swipeActions = (it: Item): SwipeAction[] => [
  isClean(it)
    ? { label: 'Dirty', icon: 'pi pi-inbox', onPress: () => emit('markDirty', it.id) }
    : { label: 'Clean', icon: 'pi pi-check', onPress: () => emit('markClean', it.id) },
  {
    label: props.house === 'a' ? '→ B' : '→ A',
    icon: 'pi pi-arrow-right',
    danger: true,
    onPress: () => emit('move', it.id, props.house === 'a' ? 'b' : 'a'),
  },
]

const setFilter = (v: Filter) => {
  const isCategory = v !== 'all' && v !== 'clean' && v !== 'dirty'
  filter.value = filter.value === v && isCategory ? 'all' : v
}

const pillSeverity = (active: boolean) => (active ? 'contrast' : 'secondary')
const pillVariant = (active: boolean) => (active ? undefined : 'outlined' as const)
</script>

<template>
  <div class="wt-view">
    <Header
      title="Inventory"
      :subtitle="`${totalClean} clean · ${totalDirty} dirty`"
      :house="house"
      :summaries="summaries"
      @set-house="(h) => emit('switchHouse', h)"
    >
      <template #trailing>
        <Button
          severity="contrast"
          rounded
          icon="pi pi-plus"
          class="wt-inv-add-btn"
          @click="emit('openAdd')"
        />
      </template>
    </Header>

    <div class="wt-scroll wt-scroll-x wt-pill-scroller--tight">
      <div class="wt-pill-row">
        <Button
          rounded
          size="small"
          :severity="pillSeverity(filter === 'all')"
          :variant="pillVariant(filter === 'all')"
          label="All"
          @click="filter = 'all'"
        />
        <Button
          rounded
          size="small"
          :severity="pillSeverity(filter === 'clean')"
          :variant="pillVariant(filter === 'clean')"
          label="Clean"
          @click="filter = 'clean'"
        />
        <Button
          rounded
          size="small"
          :severity="pillSeverity(filter === 'dirty')"
          :variant="pillVariant(filter === 'dirty')"
          label="Dirty"
          @click="filter = 'dirty'"
        />
        <div class="wt-pill-divider" />
        <Button
          v-for="c in CATEGORIES"
          :key="c"
          rounded
          size="small"
          :severity="pillSeverity(filter === c)"
          :variant="pillVariant(filter === c)"
          :label="c"
          @click="setFilter(c)"
        />
      </div>
    </div>

    <div class="wt-scroll wt-scroll-y wt-scroll-y--cta">
      <div v-if="catOrder.length === 0" class="wt-inv-empty">
        Nothing matches that filter.
      </div>
      <div v-for="c in catOrder" :key="c" class="wt-inv-group">
        <div class="wt-inv-group__header">
          <SectionLabel inline>{{ c }}</SectionLabel>
          <span class="wt-inv-group__count">{{ groups[c].length }}</span>
        </div>
        <Card inset>
          <ItemRow
            v-for="(it, i) in groups[c]"
            :key="it.id"
            :item="it"
            :is-last="i === groups[c].length - 1"
            :swipe-actions="swipeActions(it)"
            @open="emit('openItem', it)"
          >
            <template #trailing>
              <button
                type="button"
                class="wt-row__trailing-btn"
                @click.stop="emit('openItem', it)"
              >
                <WearMeter :wears="it.w" :lim="it.lim" />
              </button>
            </template>
          </ItemRow>
        </Card>
      </div>
    </div>
  </div>
</template>

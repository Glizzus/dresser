<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from '../components/Card.vue'
import Header from '../components/Header.vue'
import ItemRow, { type SwipeAction } from '../components/ItemRow.vue'
import Pill from '../components/Pill.vue'
import SectionLabel from '../components/SectionLabel.vue'
import WearMeter from '../components/WearMeter.vue'
import {
  IconCheck,
  IconDirty,
  IconMove,
  IconPlus,
} from '../components/icons'
import { CATEGORIES, atHouse, isClean } from '../lib/data'
import { T } from '../lib/tokens'
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
    ? { label: 'Dirty', icon: IconDirty, onPress: () => emit('markDirty', it.id) }
    : { label: 'Clean', icon: IconCheck, onPress: () => emit('markClean', it.id) },
  {
    label: props.house === 'a' ? '→ B' : '→ A',
    icon: IconMove,
    danger: true,
    onPress: () => emit('move', it.id, props.house === 'a' ? 'b' : 'a'),
  },
]

const setFilter = (v: Filter) => {
  const isCategory = v !== 'all' && v !== 'clean' && v !== 'dirty'
  filter.value = filter.value === v && isCategory ? 'all' : v
}
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: T.bg,
    }"
  >
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
          :pt="{ root: { style: { width: '38px', height: '38px', padding: 0 } } }"
          @click="emit('openAdd')"
        >
          <IconPlus />
        </Button>
      </template>
    </Header>

    <div :style="{ padding: '2px 0 10px' }">
      <div class="wt-scroll" :style="{ overflowX: 'auto', padding: '4px 16px' }">
        <div :style="{ display: 'flex', gap: '6px', paddingRight: '16px' }">
          <Pill :active="filter === 'all'" size="sm" @press="filter = 'all'">All</Pill>
          <Pill :active="filter === 'clean'" size="sm" @press="filter = 'clean'">Clean</Pill>
          <Pill :active="filter === 'dirty'" size="sm" @press="filter = 'dirty'">Dirty</Pill>
          <div
            :style="{
              width: '1px',
              alignSelf: 'stretch',
              background: T.div,
              margin: '0 4px',
            }"
          />
          <Pill
            v-for="c in CATEGORIES"
            :key="c"
            :active="filter === c"
            size="sm"
            @press="setFilter(c)"
          >
            {{ c }}
          </Pill>
        </div>
      </div>
    </div>

    <div
      class="wt-scroll"
      :style="{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
      }"
    >
      <div
        v-if="catOrder.length === 0"
        :style="{
          padding: '48px 24px',
          textAlign: 'center',
          color: T.sub,
        }"
      >
        Nothing matches that filter.
      </div>
      <div v-for="c in catOrder" :key="c" :style="{ marginBottom: '16px' }">
        <div
          :style="{
            padding: '4px 16px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }"
        >
          <SectionLabel inline>{{ c }}</SectionLabel>
          <span :style="{ fontSize: '11.5px', color: T.faint, fontWeight: 600 }">
            {{ groups[c].length }}
          </span>
        </div>
        <Card :style="{ margin: '0 16px' }">
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
                :style="{ padding: 0, background: 'transparent', border: 0 }"
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

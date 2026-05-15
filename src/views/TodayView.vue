<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from '../components/Card.vue'
import Header from '../components/Header.vue'
import ItemRow from '../components/ItemRow.vue'
import SectionLabel from '../components/SectionLabel.vue'
import { HOUSES, atHouse, isClean, resolveOutfit } from '../lib/data'
import type { HouseId, HouseSummary, Item, Outfit } from '../lib/types'

const props = defineProps<{
  items: Item[]
  outfits: Outfit[]
  house: HouseId
  summaries: Record<HouseId, HouseSummary>
}>()

const emit = defineEmits<{
  log: [ids: string[]]
  switchHouse: [h: HouseId]
  openLaundry: []
}>()

const selected = ref(new Set<string>())
const activeOutfit = ref<string | null>(null)

const houseItems = computed(() =>
  props.items.filter((i) => atHouse(i, props.house) && isClean(i)),
)

const sorted = computed(() =>
  [...houseItems.value].sort((a, b) => a.w / a.lim - b.w / b.lim),
)

const today = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }),
)

const toggle = (id: string) => {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
  activeOutfit.value = null
}

const applyOutfit = (outfit: Outfit) => {
  if (activeOutfit.value === outfit.id) {
    selected.value = new Set()
    activeOutfit.value = null
    return
  }
  const picks = resolveOutfit(outfit, props.items, props.house)
  const next = new Set<string>()
  for (const p of picks) if (p.item) next.add(p.item.id)
  selected.value = next
  activeOutfit.value = outfit.id
}

const handleLog = () => {
  if (selected.value.size === 0) return
  emit('log', [...selected.value])
  selected.value = new Set()
  activeOutfit.value = null
}

const outfitAvailability = computed(() => {
  const m = new Map<string, boolean>()
  for (const o of props.outfits) {
    m.set(o.id, resolveOutfit(o, props.items, props.house).every((p) => p.item))
  }
  return m
})

const outfitPossible = (o: Outfit) => outfitAvailability.value.get(o.id) ?? false
</script>

<template>
  <div class="wt-view">
    <Header
      title="Today"
      :subtitle="today"
      :house="house"
      :summaries="summaries"
      @set-house="(h) => emit('switchHouse', h)"
    />

    <div class="wt-scroll wt-scroll-y">
      <SectionLabel>Quick outfit</SectionLabel>
      <div class="wt-scroll wt-scroll-x wt-pill-scroller">
        <div class="wt-pill-row wt-pill-row--lg">
          <Button
            v-for="o in outfits"
            :key="o.id"
            :severity="activeOutfit === o.id ? 'contrast' : 'secondary'"
            :variant="activeOutfit === o.id ? undefined : 'outlined'"
            :disabled="!outfitPossible(o)"
            rounded
            @click="applyOutfit(o)"
          >
            <span>{{ o.icon }}</span>
            <span>{{ o.name }}</span>
            <span v-if="!outfitPossible(o)" class="wt-outfit-unavailable">
              unavailable
            </span>
          </Button>
        </div>
      </div>

      <div class="wt-today-meta">
        <SectionLabel inline>Items at {{ HOUSES[house].name }}</SectionLabel>
        <div>{{ selected.size }} selected · {{ sorted.length }} clean</div>
      </div>
      <Card inset>
        <ItemRow
          v-for="(it, i) in sorted"
          :key="it.id"
          :item="it"
          toggleable
          :checked="selected.has(it.id)"
          :is-last="i === sorted.length - 1"
          @toggle="toggle(it.id)"
        />
        <div v-if="sorted.length === 0" class="wt-today-empty">
          Nothing clean here. <b>Do laundry</b>.
        </div>
      </Card>

      <div class="wt-today-pad-bot">
        <Button
          severity="secondary"
          variant="outlined"
          fluid
          icon="pi pi-inbox"
          :label="`Did laundry at ${HOUSES[house].name}`"
          @click="emit('openLaundry')"
        />
      </div>
    </div>

    <div class="wt-cta-anchor">
      <Button
        fluid
        size="large"
        severity="contrast"
        :disabled="selected.size === 0"
        @click="handleLog"
      >
        <template v-if="selected.size === 0">Pick items you wore</template>
        <template v-else>
          Log {{ selected.size }} item{{ selected.size === 1 ? '' : 's' }} →
        </template>
      </Button>
    </div>
  </div>
</template>

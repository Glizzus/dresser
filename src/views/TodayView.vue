<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from '../components/Card.vue'
import CTA from '../components/CTA.vue'
import Header from '../components/Header.vue'
import ItemRow from '../components/ItemRow.vue'
import SectionLabel from '../components/SectionLabel.vue'
import { IconDirty, IconPlus } from '../components/icons'
import { HOUSES, atHouse, isClean, resolveOutfit } from '../lib/data'
import { T } from '../lib/tokens'
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
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: T.bg,
    }"
  >
    <Header
      title="Today"
      :subtitle="today"
      :house="house"
      :summaries="summaries"
      @set-house="(h) => emit('switchHouse', h)"
    />

    <div class="wt-scroll" :style="{ flex: 1, overflowY: 'auto' }">
      <div :style="{ padding: '0 0 4px' }">
        <SectionLabel>Quick outfit</SectionLabel>
        <div class="wt-scroll" :style="{ overflowX: 'auto', padding: '4px 16px 6px' }">
          <div :style="{ display: 'flex', gap: '8px', paddingRight: '16px' }">
            <Button
              v-for="o in outfits"
              :key="o.id"
              :severity="activeOutfit === o.id ? 'contrast' : 'secondary'"
              :variant="activeOutfit === o.id ? undefined : 'outlined'"
              :disabled="!outfitPossible(o)"
              :pt="{ root: { style: { borderRadius: '14px', flexShrink: 0, fontWeight: 600 } } }"
              @click="applyOutfit(o)"
            >
              <span :style="{ fontSize: '18px' }">{{ o.icon }}</span>
              <span>{{ o.name }}</span>
              <span
                v-if="!outfitPossible(o)"
                :style="{
                  fontSize: '10.5px',
                  color: T.warn,
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }"
              >unavailable</span>
            </Button>
            <Button
              severity="secondary"
              variant="outlined"
              :pt="{ root: { style: { borderRadius: '14px', flexShrink: 0 } } }"
            >
              <IconPlus /> New
            </Button>
          </div>
        </div>
      </div>

      <div :style="{ padding: '6px 0 12px' }">
        <div
          :style="{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '4px 16px 4px',
          }"
        >
          <SectionLabel inline>Items at {{ HOUSES[house].name }}</SectionLabel>
          <div :style="{ fontSize: '12.5px', color: T.sub, letterSpacing: '-0.1px' }">
            {{ selected.size }} selected · {{ sorted.length }} clean
          </div>
        </div>
        <Card :style="{ margin: '0 16px' }">
          <ItemRow
            v-for="(it, i) in sorted"
            :key="it.id"
            :item="it"
            toggleable
            :checked="selected.has(it.id)"
            :is-last="i === sorted.length - 1"
            @toggle="toggle(it.id)"
          />
          <div
            v-if="sorted.length === 0"
            :style="{
              padding: '22px 16px',
              textAlign: 'center',
              color: T.sub,
              fontSize: '14px',
            }"
          >
            Nothing clean here.
            <b :style="{ color: T.ink }">Do laundry</b>.
          </div>
        </Card>
      </div>

      <div :style="{ padding: '4px 16px 200px' }">
        <Button
          severity="secondary"
          variant="outlined"
          fluid
          :pt="{ root: { style: { borderRadius: '14px' } } }"
          @click="emit('openLaundry')"
        >
          <IconDirty />
          Did laundry at {{ HOUSES[house].name }}
        </Button>
      </div>
    </div>

    <div
      :style="{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 'calc(env(safe-area-inset-bottom) + 70px)',
        padding: '8px 16px',
        pointerEvents: 'none',
      }"
    >
      <div :style="{ pointerEvents: 'auto' }">
        <CTA :disabled="selected.size === 0" @press="handleLog">
          <template v-if="selected.size === 0">Pick items you wore</template>
          <template v-else>
            Log {{ selected.size }} item{{ selected.size === 1 ? '' : 's' }} →
          </template>
        </CTA>
      </div>
    </div>
  </div>
</template>

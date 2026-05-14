<script setup lang="ts">
import { computed } from 'vue'
import Card from '../components/Card.vue'
import CTA from '../components/CTA.vue'
import Header from '../components/Header.vue'
import SectionLabel from '../components/SectionLabel.vue'
import SevChip from '../components/SevChip.vue'
import { IconDirty } from '../components/icons'
import { HOUSES, dirtyAt, invariants } from '../lib/data'
import { T } from '../lib/tokens'
import type {
  HouseId,
  HouseSummary,
  Invariant,
  Item,
} from '../lib/types'

const props = defineProps<{
  items: Item[]
  house: HouseId
  summaries: Record<HouseId, HouseSummary>
}>()

const emit = defineEmits<{
  switchHouse: [h: HouseId]
  openLaundry: []
}>()

const grouped = computed(() => {
  const broken: Invariant[] = []
  const low: Invariant[] = []
  const ok: Invariant[] = []
  const all = invariants(props.items, props.house)
  for (const i of all) {
    if (i.severity === 'broken') broken.push(i)
    else if (i.severity === 'low') low.push(i)
    else ok.push(i)
  }
  return { broken, low, ok, total: all.length, okAll: broken.length + low.length === 0 }
})

const issueSections = computed(() => [
  { title: 'Broken', items: grouped.value.broken },
  { title: 'Running low', items: grouped.value.low },
])

const dirty = computed(() => dirtyAt(props.items, props.house))

const subtitle = computed(() => {
  if (grouped.value.okAll) return 'Everything holding'
  const n = grouped.value.broken.length + grouped.value.low.length
  return `${n} thing${n === 1 ? '' : 's'} to fix`
})

const hamperPreview = computed(() =>
  dirty.value
    .slice(0, 6)
    .map((d) => d.name)
    .join(' · '),
)
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
      title="Status"
      :subtitle="subtitle"
      :house="house"
      :summaries="summaries"
      @set-house="(h) => emit('switchHouse', h)"
    />

    <div
      class="wt-scroll"
      :style="{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 130px)',
      }"
    >
      <div :style="{ padding: '4px 16px 14px' }">
        <Card
          v-if="grouped.okAll"
          :padding="16"
          :style="{ background: T.okBg, boxShadow: 'none' }"
        >
          <div
            :style="{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }"
          >
            <div
              :style="{
                fontSize: '20px',
                fontWeight: 700,
                color: T.ok,
                letterSpacing: '-0.3px',
              }"
            >
              All invariants holding
            </div>
            <SevChip severity="ok">✓ {{ grouped.ok.length }}/{{ grouped.total }}</SevChip>
          </div>
          <div
            :style="{
              fontSize: '13.5px',
              color: T.ok,
              opacity: 0.85,
              marginTop: '4px',
            }"
          >
            <template v-if="dirty.length === 0">Hamper is empty too.</template>
            <template v-else>
              {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }} in the hamper · still fine.
            </template>
          </div>
        </Card>
        <Card
          v-else
          :padding="16"
          :style="{ background: T.warnBg, boxShadow: 'none' }"
        >
          <div
            :style="{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }"
          >
            <div
              :style="{
                fontSize: '22px',
                fontWeight: 700,
                color: T.warnInk,
                letterSpacing: '-0.4px',
              }"
            >
              <template v-if="grouped.broken.length > 0">
                {{ grouped.broken.length }} invariant{{ grouped.broken.length === 1 ? '' : 's' }} broken
              </template>
              <template v-else>{{ grouped.low.length }} running low</template>
            </div>
            <SevChip :severity="grouped.broken.length > 0 ? 'broken' : 'low'">
              {{ grouped.broken.length > 0 ? '!' : 'low' }}
            </SevChip>
          </div>
          <div
            :style="{
              fontSize: '13.5px',
              color: T.warnInk,
              opacity: 0.8,
              marginTop: '6px',
              lineHeight: 1.45,
            }"
          >
            <template v-if="grouped.broken.length > 0">
              Wash <b>1 load</b> tonight to fix all of these.
            </template>
            <template v-else>Consider a small load soon.</template>
          </div>
        </Card>
      </div>

      <template v-for="section in issueSections" :key="section.title">
        <div v-if="section.items.length > 0" :style="{ marginBottom: '16px' }">
          <SectionLabel>{{ section.title }}</SectionLabel>
          <div :style="{ marginTop: '6px' }">
            <Card
              v-for="i in section.items"
              :key="i.id"
              :padding="14"
              :style="{ margin: '0 16px 8px' }"
            >
              <div
                :style="{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '8px',
                }"
              >
                <div :style="{ flex: 1, minWidth: 0 }">
                  <div
                    :style="{
                      fontSize: '16px',
                      fontWeight: 600,
                      letterSpacing: '-0.2px',
                    }"
                  >
                    {{ i.have }} / {{ i.need }} {{ i.label }}
                  </div>
                  <div :style="{ fontSize: '12.5px', color: T.sub, marginTop: '2px' }">
                    {{ i.detail }}
                  </div>
                </div>
                <SevChip :severity="i.severity">{{ i.severity }}</SevChip>
              </div>
              <div
                v-if="i.fix"
                :style="{
                  marginTop: '10px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: T.surface2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: T.ink2,
                  fontWeight: 500,
                }"
              >
                <span
                  :style="{
                    width: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    background: T.ink,
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }"
                >!</span>
                <span :style="{ flex: 1 }">{{ i.fix }}</span>
                <span
                  v-if="i.bottleneck"
                  :style="{
                    fontSize: '11px',
                    color: T.sub,
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                    textTransform: 'uppercase',
                  }"
                >bottleneck</span>
              </div>
            </Card>
          </div>
        </div>
      </template>

      <div v-if="grouped.ok.length > 0" :style="{ marginBottom: '16px', opacity: 0.85 }">
        <SectionLabel>Holding</SectionLabel>
        <div :style="{ marginTop: '6px' }">
          <Card :style="{ margin: '0 16px' }">
            <div
              v-for="(i, k) in grouped.ok"
              :key="i.id"
              :style="{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: k < grouped.ok.length - 1 ? `0.5px solid ${T.div}` : 'none',
              }"
            >
              <div>
                <div
                  :style="{
                    fontSize: '15px',
                    fontWeight: 500,
                    letterSpacing: '-0.2px',
                  }"
                >
                  ≥{{ i.need }} {{ i.label }}
                </div>
                <div :style="{ fontSize: '12.5px', color: T.sub, marginTop: '2px' }">
                  {{ i.detail }}
                </div>
              </div>
              <SevChip severity="ok">✓</SevChip>
            </div>
          </Card>
        </div>
      </div>

      <div :style="{ marginBottom: '16px' }">
        <SectionLabel>Hamper</SectionLabel>
        <div :style="{ marginTop: '6px' }">
          <Card :style="{ margin: '0 16px' }" :padding="14">
            <div
              :style="{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }"
            >
              <div :style="{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.2px' }">
                {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }} dirty
              </div>
              <div :style="{ fontSize: '12px', color: T.sub }">
                {{ HOUSES[house].name }}
              </div>
            </div>
            <div
              v-if="dirty.length > 0"
              :style="{
                fontSize: '13px',
                color: T.sub,
                marginTop: '6px',
                lineHeight: 1.45,
              }"
            >
              {{ hamperPreview }}<template v-if="dirty.length > 6">
                · +{{ dirty.length - 6 }} more
              </template>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <div
      v-if="dirty.length > 0"
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
        <CTA @press="emit('openLaundry')">
          <template #icon><IconDirty /></template>
          Did laundry at {{ HOUSES[house].name }}
        </CTA>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from '../components/Card.vue'
import Header from '../components/Header.vue'
import SectionLabel from '../components/SectionLabel.vue'
import { HOUSES, dirtyAt, invariants } from '../lib/data'
import type {
  HouseId,
  HouseSummary,
  Invariant,
  Item,
  Severity,
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

const sevTag = (s: Severity) =>
  s === 'ok' ? 'success' : s === 'low' ? 'warn' : 'danger'
</script>

<template>
  <div class="wt-view">
    <Header
      title="Status"
      :subtitle="subtitle"
      :house="house"
      :summaries="summaries"
      @set-house="(h) => emit('switchHouse', h)"
    />

    <div class="wt-scroll wt-scroll-y wt-scroll-y--cta-tall">
      <div class="wt-status-summary">
        <Card v-if="grouped.okAll" :pad="16" variant="ok">
          <div class="wt-status-row">
            <div class="wt-status-headline--ok">All invariants holding</div>
            <Tag severity="success" :value="`✓ ${grouped.ok.length}/${grouped.total}`" />
          </div>
          <div class="wt-status-body wt-status-body--ok">
            <template v-if="dirty.length === 0">Hamper is empty too.</template>
            <template v-else>
              {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }} in the hamper · still fine.
            </template>
          </div>
        </Card>
        <Card v-else :pad="16" variant="warn">
          <div class="wt-status-row">
            <div class="wt-status-headline">
              <template v-if="grouped.broken.length > 0">
                {{ grouped.broken.length }} invariant{{ grouped.broken.length === 1 ? '' : 's' }} broken
              </template>
              <template v-else>{{ grouped.low.length }} running low</template>
            </div>
            <Tag
              :severity="grouped.broken.length > 0 ? 'danger' : 'warn'"
              :value="grouped.broken.length > 0 ? '!' : 'low'"
            />
          </div>
          <div class="wt-status-body wt-status-body--warn">
            <template v-if="grouped.broken.length > 0">
              Wash <b>1 load</b> tonight to fix all of these.
            </template>
            <template v-else>Consider a small load soon.</template>
          </div>
        </Card>
      </div>

      <template v-for="section in issueSections" :key="section.title">
        <div v-if="section.items.length > 0" class="wt-inv-group">
          <SectionLabel>{{ section.title }}</SectionLabel>
          <div class="wt-inv-group__body">
            <Card v-for="i in section.items" :key="i.id" :pad="14" class="wt-issue">
              <div class="wt-issue__row">
                <div class="wt-issue__title">
                  <div class="wt-issue__title-line">
                    {{ i.have }} / {{ i.need }} {{ i.label }}
                  </div>
                  <div class="wt-issue__detail">{{ i.detail }}</div>
                </div>
                <Tag :severity="sevTag(i.severity)" :value="i.severity" />
              </div>
              <div v-if="i.fix" class="wt-issue__fix">
                <span class="wt-issue__fix-dot">!</span>
                <span class="wt-issue__fix-text">{{ i.fix }}</span>
                <span v-if="i.bottleneck" class="wt-issue__bottleneck">
                  bottleneck
                </span>
              </div>
            </Card>
          </div>
        </div>
      </template>

      <div v-if="grouped.ok.length > 0" class="wt-inv-group wt-inv-group--dim">
        <SectionLabel>Holding</SectionLabel>
        <Card inset class="wt-inv-group__body">
          <div
            v-for="(i, k) in grouped.ok"
            :key="i.id"
            class="wt-holding-row"
            :class="k === grouped.ok.length - 1 && 'wt-holding-row--last'"
          >
            <div>
              <div class="wt-holding-line">≥{{ i.need }} {{ i.label }}</div>
              <div class="wt-holding-detail">{{ i.detail }}</div>
            </div>
            <Tag severity="success" value="✓" />
          </div>
        </Card>
      </div>

      <div class="wt-inv-group">
        <SectionLabel>Hamper</SectionLabel>
        <Card inset :pad="14" class="wt-inv-group__body">
          <div class="wt-hamper-row">
            <div class="wt-hamper-count">
              {{ dirty.length }} item{{ dirty.length === 1 ? '' : 's' }} dirty
            </div>
            <div class="wt-hamper-house">{{ HOUSES[house].name }}</div>
          </div>
          <div v-if="dirty.length > 0" class="wt-hamper-preview">
            {{ hamperPreview }}<template v-if="dirty.length > 6">
              · +{{ dirty.length - 6 }} more
            </template>
          </div>
        </Card>
      </div>
    </div>

    <div v-if="dirty.length > 0" class="wt-cta-anchor">
      <Button
        fluid
        size="large"
        severity="contrast"
        icon="pi pi-inbox"
        :label="`Did laundry at ${HOUSES[house].name}`"
        @click="emit('openLaundry')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { HOUSES } from '../lib/data'
import { T } from '../lib/tokens'
import type { HouseId, HouseSummary } from '../lib/types'

defineProps<{
  title: string
  subtitle?: string
  house: HouseId
  summaries: Record<HouseId, HouseSummary>
}>()

const emit = defineEmits<{ setHouse: [h: HouseId] }>()

const houseIds: HouseId[] = ['a', 'b']
</script>

<template>
  <div
    :style="{
      background: T.bg,
      paddingTop: 'max(58px, calc(env(safe-area-inset-top) + 14px))',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }"
  >
    <div :style="{ padding: '0 16px 4px', display: 'flex', gap: '8px' }">
      <Button
        v-for="h in houseIds"
        :key="h"
        :severity="house === h ? 'secondary' : 'contrast'"
        :variant="house === h ? 'outlined' : undefined"
        fluid
        :pt="{ root: { style: { justifyContent: 'space-between', borderRadius: '14px', fontWeight: 600 } } }"
        @click="emit('setHouse', h)"
      >
        <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '8px' }">
          <span
            :style="{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: house === h ? T.ink : '#fff',
              opacity: house === h ? 1 : 0.55,
            }"
          />
          {{ HOUSES[h].name }}
        </span>
        <Badge
          v-if="summaries[h].warn > 0"
          :value="String(summaries[h].warn)"
          severity="danger"
        />
      </Button>
    </div>
    <div
      :style="{
        padding: '12px 16px 12px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '10px',
      }"
    >
      <div :style="{ flex: 1, minWidth: 0 }">
        <div
          :style="{
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '-0.6px',
            lineHeight: 1.05,
          }"
        >
          {{ title }}
        </div>
        <div
          v-if="subtitle"
          :style="{
            fontSize: '14px',
            color: T.sub,
            marginTop: '2px',
            letterSpacing: '-0.1px',
          }"
        >
          {{ subtitle }}
        </div>
      </div>
      <slot name="trailing" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { HOUSES } from '../lib/data'
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
  <div class="wt-header">
    <div class="wt-header__houses">
      <Button
        v-for="h in houseIds"
        :key="h"
        :severity="house === h ? 'contrast' : 'secondary'"
        :variant="house === h ? undefined : 'outlined'"
        :style="
          house === h
            ? { background: '#16161C', color: '#fff', borderColor: '#16161C' }
            : undefined
        "
        fluid
        @click="emit('setHouse', h)"
      >
        <span class="wt-house-label">
          <span class="wt-house-dot" :class="house === h && 'wt-house-dot--active'" />
          {{ HOUSES[h].name }}
        </span>
        <Badge
          v-if="summaries[h].warn > 0"
          :value="String(summaries[h].warn)"
          severity="danger"
        />
      </Button>
    </div>
    <div class="wt-header__main">
      <div class="wt-header__titles">
        <div class="wt-header__title">{{ title }}</div>
        <div v-if="subtitle" class="wt-header__subtitle">{{ subtitle }}</div>
      </div>
      <slot name="trailing" />
    </div>
  </div>
</template>

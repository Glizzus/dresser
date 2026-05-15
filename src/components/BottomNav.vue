<script setup lang="ts">
import OverlayBadge from 'primevue/overlaybadge'
import type { Tab } from '../lib/types'

withDefaults(
  defineProps<{
    tab: Tab
    statusBadge?: number
  }>(),
  { statusBadge: 0 },
)

const emit = defineEmits<{ setTab: [t: Tab] }>()

const items: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'pi pi-check-circle' },
  { id: 'inv', label: 'Inventory', icon: 'pi pi-box' },
  { id: 'status', label: 'Status', icon: 'pi pi-chart-bar' },
]
</script>

<template>
  <div class="wt-bottom-nav">
    <button
      v-for="it in items"
      :key="it.id"
      type="button"
      class="wt-bottom-nav__btn"
      :class="tab === it.id && 'wt-bottom-nav__btn--active'"
      @click="emit('setTab', it.id)"
    >
      <OverlayBadge
        v-if="it.id === 'status' && statusBadge > 0"
        :value="String(statusBadge)"
        severity="danger"
        size="small"
      >
        <i :class="['wt-bottom-nav__icon', it.icon]" />
      </OverlayBadge>
      <i v-else :class="['wt-bottom-nav__icon', it.icon]" />
      <span class="wt-bottom-nav__label">{{ it.label }}</span>
    </button>
  </div>
</template>

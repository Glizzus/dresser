<script setup lang="ts">
import OverlayBadge from 'primevue/overlaybadge'
import { T } from '../lib/tokens'
import type { Tab } from '../lib/types'
import { IconCheck, IconPulse, IconStack } from './icons'

withDefaults(
  defineProps<{
    tab: Tab
    statusBadge?: number
  }>(),
  { statusBadge: 0 },
)

const emit = defineEmits<{ setTab: [t: Tab] }>()

const items: { id: Tab; label: string; icon: typeof IconCheck }[] = [
  { id: 'today', label: 'Today', icon: IconCheck },
  { id: 'inv', label: 'Inventory', icon: IconStack },
  { id: 'status', label: 'Status', icon: IconPulse },
]
</script>

<template>
  <div
    :style="{
      borderTop: `0.5px solid ${T.divStrong}`,
      background: 'rgba(244,242,236,0.92)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
      display: 'flex',
      padding: '6px 8px calc(env(safe-area-inset-bottom) + 12px)',
    }"
  >
    <button
      v-for="it in items"
      :key="it.id"
      type="button"
      :style="{
        flex: 1,
        padding: '7px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        color: tab === it.id ? T.ink : T.sub,
        position: 'relative',
      }"
      @click="emit('setTab', it.id)"
    >
      <OverlayBadge
        v-if="it.id === 'status' && statusBadge > 0"
        :value="String(statusBadge)"
        severity="danger"
        size="small"
      >
        <component :is="it.icon" :active="tab === it.id" />
      </OverlayBadge>
      <component :is="it.icon" v-else :active="tab === it.id" />
      <span
        :style="{
          fontSize: '11px',
          fontWeight: tab === it.id ? 600 : 500,
          letterSpacing: '0.1px',
        }"
      >
        {{ it.label }}
      </span>
    </button>
  </div>
</template>

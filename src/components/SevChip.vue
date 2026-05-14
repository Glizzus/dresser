<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import type { Severity } from '../lib/types'

const props = defineProps<{ severity: Severity }>()

const sev = computed(() => {
  switch (props.severity) {
    case 'ok':
      return 'success' as const
    case 'low':
      return 'warn' as const
    case 'broken':
      return 'danger' as const
  }
})
</script>

<template>
  <Tag
    :severity="sev"
    :pt="{
      root: {
        style: {
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          fontSize: '11px',
          fontWeight: 700,
        },
      },
    }"
  >
    <slot />
  </Tag>
</template>

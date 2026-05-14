<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

const props = withDefaults(
  defineProps<{
    active?: boolean
    danger?: boolean
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ press: [] }>()

const severity = computed(() => {
  if (props.danger) return 'danger' as const
  if (props.active) return 'contrast' as const
  return 'secondary' as const
})

const variant = computed(() =>
  props.active || props.danger ? undefined : ('outlined' as const),
)

const sz = computed(() => (props.size === 'sm' ? 'small' : undefined))
</script>

<template>
  <Button
    rounded
    :size="sz"
    :severity="severity"
    :variant="variant"
    :pt="{ root: { style: { whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600 } } }"
    @click="emit('press')"
  >
    <slot />
  </Button>
</template>

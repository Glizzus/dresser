<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

const props = withDefaults(
  defineProps<{
    kind?: 'primary' | 'secondary' | 'ghost'
    disabled?: boolean
    danger?: boolean
  }>(),
  { kind: 'primary' },
)

const emit = defineEmits<{ press: [] }>()

const severity = computed(() => {
  if (props.danger) return 'danger' as const
  if (props.kind === 'primary') return 'contrast' as const
  return 'secondary' as const
})

const variant = computed(() => (props.kind === 'ghost' ? 'outlined' : undefined))
</script>

<template>
  <Button
    fluid
    size="large"
    :severity="severity"
    :variant="variant"
    :disabled="disabled"
    :pt="{ root: { style: { borderRadius: '16px', fontWeight: 600 } } }"
    @click="!disabled && emit('press')"
  >
    <slot name="icon" />
    <slot />
  </Button>
</template>

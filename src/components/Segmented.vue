<script setup lang="ts">
import { computed } from 'vue'
import SelectButton from 'primevue/selectbutton'

const props = defineProps<{
  value: string
  options: { id: string; label: string }[]
}>()

const emit = defineEmits<{ change: [v: string] }>()

const model = computed({
  get: () => props.value,
  set: (v: string) => emit('change', v),
})
</script>

<template>
  <SelectButton
    v-model="model"
    :options="options"
    option-label="label"
    option-value="id"
    :allow-empty="false"
    fluid
  />
</template>

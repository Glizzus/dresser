<script setup lang="ts">
import { ref, watch } from 'vue'
import Drawer from 'primevue/drawer'
import { T } from '../lib/tokens'

const props = withDefaults(defineProps<{ height?: string }>(), { height: '90%' })
const emit = defineEmits<{ close: [] }>()

const visible = ref(true)
watch(visible, (v) => {
  if (!v) emit('close')
})
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="bottom"
    :pt="{
      root: {
        style: {
          height: props.height,
          background: T.bg,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        },
      },
      content: { style: { display: 'flex', flexDirection: 'column', padding: 0 } },
    }"
  >
    <slot />
  </Drawer>
</template>

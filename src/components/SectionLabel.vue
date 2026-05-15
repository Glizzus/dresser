<script setup lang="ts">
withDefaults(defineProps<{ inline?: boolean }>(), { inline: false })
</script>

<template>
  <div class="wt-section-label" :class="inline && 'wt-section-label--inline'">
    <slot />
  </div>
</template>

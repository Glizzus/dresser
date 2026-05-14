<script setup lang="ts">
import { ref } from 'vue'
import TodayView from './views/TodayView.vue'
import InventoryView from './views/InventoryView.vue'
import StatusView from './views/StatusView.vue'

type View = 'today' | 'inventory' | 'status'
const currentView = ref<View>('today')

const tabs: { id: View; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'status', label: 'Status' },
]
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <main class="flex-1 p-4 pb-20">
      <TodayView v-if="currentView === 'today'" />
      <InventoryView v-else-if="currentView === 'inventory'" />
      <StatusView v-else-if="currentView === 'status'" />
    </main>
    <nav class="fixed bottom-0 inset-x-0 grid grid-cols-3 border-t bg-white">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="py-3 text-sm"
        :class="currentView === tab.id ? 'font-semibold' : 'text-gray-500'"
        @click="currentView = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>

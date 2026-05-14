<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import BottomNav from './components/BottomNav.vue'
import { useWardrobe } from './composables/useWardrobe'
import { T } from './lib/tokens'
import type { HouseId, Item, Tab } from './lib/types'
import LaundrySheet from './sheets/LaundrySheet.vue'
import ItemSheet from './sheets/ItemSheet.vue'
import InventoryView from './views/InventoryView.vue'
import StatusView from './views/StatusView.vue'
import TodayView from './views/TodayView.vue'

const {
  state,
  summaries,
  toast,
  clearToast,
  logOutfit,
  doLaundry,
  markDirty,
  markClean,
  moveItem,
  saveItem,
  deleteItem,
  switchHouse,
} = useWardrobe()

const tab = ref<Tab>('today')
const openItem = ref<string | 'new' | null>(null)
const showLaundry = ref(false)

const currentBadge = computed(() => summaries.value[state.house].warn)
const editingItem = computed<Item | null>(() => {
  if (!openItem.value || openItem.value === 'new') return null
  return state.items.find((i) => i.id === openItem.value) ?? null
})

const onSwitchHouse = (h: HouseId) => switchHouse(h)
const onOpenLaundry = () => (showLaundry.value = true)
const onLaundryConfirm = () => {
  doLaundry(state.house)
  showLaundry.value = false
}

const onItemSave = (it: Partial<Item> & { id?: string }) => {
  saveItem(it)
  openItem.value = null
}
const onItemDelete = (id: string) => {
  deleteItem(id)
  openItem.value = null
}
const onItemMarkDirty = (id: string) => {
  markDirty(id)
  openItem.value = null
}
const onItemMarkClean = (id: string) => {
  markClean(id)
  openItem.value = null
}

const toastService = useToast()
watch(toast, (t) => {
  if (!t) return
  toastService.add({
    severity:
      t.kind === 'ok' ? 'success' : t.kind === 'loc' ? 'info' : 'secondary',
    detail: t.text,
    life: 4500,
    closable: true,
  })
  clearToast()
})
</script>

<template>
  <div
    class="wt"
    :style="{
      position: 'fixed',
      inset: 0,
      background: T.bg,
      overflow: 'hidden',
    }"
  >
    <TodayView
      v-if="tab === 'today'"
      :items="state.items"
      :outfits="state.outfits"
      :house="state.house"
      :summaries="summaries"
      @log="logOutfit"
      @switch-house="onSwitchHouse"
      @open-laundry="onOpenLaundry"
    />
    <InventoryView
      v-else-if="tab === 'inv'"
      :items="state.items"
      :house="state.house"
      :summaries="summaries"
      @switch-house="onSwitchHouse"
      @mark-dirty="markDirty"
      @mark-clean="markClean"
      @move="moveItem"
      @open-item="(it) => (openItem = it.id)"
      @open-add="openItem = 'new'"
    />
    <StatusView
      v-else
      :items="state.items"
      :house="state.house"
      :summaries="summaries"
      @switch-house="onSwitchHouse"
      @open-laundry="onOpenLaundry"
    />

    <div
      :style="{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
      }"
    >
      <BottomNav :tab="tab" :status-badge="currentBadge" @set-tab="(t) => (tab = t)" />
    </div>

    <LaundrySheet
      v-if="showLaundry"
      :items="state.items"
      :house="state.house"
      @close="showLaundry = false"
      @confirm="onLaundryConfirm"
    />

    <ItemSheet
      v-if="openItem === 'new'"
      @close="openItem = null"
      @save="onItemSave"
      @delete="onItemDelete"
      @mark-dirty="onItemMarkDirty"
      @mark-clean="onItemMarkClean"
    />
    <ItemSheet
      v-else-if="editingItem"
      :key="editingItem.id"
      :item="editingItem"
      @close="openItem = null"
      @save="onItemSave"
      @delete="onItemDelete"
      @mark-dirty="onItemMarkDirty"
      @mark-clean="onItemMarkClean"
    />

    <Toast position="top-center" />
  </div>
</template>

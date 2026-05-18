// Pinia — small client-only state. Current house, the inventory filter,
// and a transient toast queue. Nothing heavy, no server data.

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { House } from '@/lib/types'

export type InventoryFilter = 'all' | 'clean' | 'dirty' | { category: string }

export interface Toast {
  id: number
  message: string
}

const HOUSE_KEY = 'dresser.house'

export const useUiStore = defineStore('ui', () => {
  // House switching is manual and persists across reloads. 'transit' is a
  // location for items, never a "current house".
  const stored = localStorage.getItem(HOUSE_KEY)
  const currentHouse = ref<'A' | 'B'>(stored === 'B' ? 'B' : 'A')

  function setHouse(house: 'A' | 'B') {
    currentHouse.value = house
    localStorage.setItem(HOUSE_KEY, house)
  }

  const filter = ref<InventoryFilter>('all')
  function setFilter(f: InventoryFilter) {
    filter.value = f
  }

  const toasts = ref<Toast[]>([])
  let nextId = 1
  function pushToast(message: string) {
    const id = nextId++
    toasts.value.push({ id, message })
    setTimeout(() => dismissToast(id), 4000)
  }
  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    currentHouse,
    setHouse,
    filter,
    setFilter,
    toasts,
    pushToast,
    dismissToast,
  }
})

export type { House }

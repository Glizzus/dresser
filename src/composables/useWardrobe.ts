import { computed, reactive, ref, watch } from 'vue'
import {
  HOUSES,
  SEED_ITEMS,
  SEED_OUTFITS,
  atHouse,
  houseSummary,
  isClean,
} from '../lib/data'
import type {
  HouseId,
  Item,
  ToastInfo,
  WardrobeState,
} from '../lib/types'

const STORAGE_KEY = 'wt-state-v1'

const initialState = (): WardrobeState => ({
  items: SEED_ITEMS.map((i) => ({ ...i })),
  outfits: SEED_OUTFITS.map((o) => ({ ...o })),
  house: 'a',
  log: [],
})

function loadState(): WardrobeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw) as WardrobeState
    if (!s.items || !Array.isArray(s.items)) return initialState()
    return s
  } catch {
    return initialState()
  }
}

const state = reactive<WardrobeState>(loadState())
const toast = ref<ToastInfo | null>(null)

watch(
  state,
  (s) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // ignore
    }
  },
  { deep: true },
)

function setToast(t: ToastInfo) {
  toast.value = t
}

function clearToast() {
  toast.value = null
}

function logOutfit(ids: string[]) {
  const today = new Date().toISOString().slice(0, 10)
  state.items = state.items.map((it) =>
    ids.includes(it.id)
      ? { ...it, w: Math.min(it.lim, it.w + 1), lastWorn: today }
      : it,
  )
  state.log = [{ date: today, itemIds: ids }, ...state.log]
  setToast({ kind: 'ok', text: `Logged ${ids.length} item${ids.length === 1 ? '' : 's'}` })
}

function doLaundry(house: HouseId) {
  state.items = state.items.map((it) =>
    atHouse(it, house) && !isClean(it) ? { ...it, w: 0 } : it,
  )
  setToast({ kind: 'ok', text: `Laundry done · ${HOUSES[house].name}` })
}

function markDirty(id: string) {
  state.items = state.items.map((it) =>
    it.id === id ? { ...it, w: it.lim } : it,
  )
}

function markClean(id: string) {
  state.items = state.items.map((it) => (it.id === id ? { ...it, w: 0 } : it))
}

function moveItem(id: string, toHouse: HouseId) {
  const item = state.items.find((i) => i.id === id)
  state.items = state.items.map((it) =>
    it.id === id ? { ...it, loc: toHouse, _transitTo: toHouse } : it,
  )
  setToast({
    text: `Moved ${item?.name ?? ''} → ${HOUSES[toHouse].name}`,
  })
}

function saveItem(item: Partial<Item> & { id?: string }) {
  const exists = item.id && state.items.find((i) => i.id === item.id)
  if (exists) {
    state.items = state.items.map((i) =>
      i.id === item.id ? { ...i, ...item } : i,
    )
  } else {
    const newItem: Item = {
      name: item.name ?? '',
      cats: item.cats ?? [],
      loc: (item.loc as HouseId) ?? 'a',
      lim: item.lim ?? 2,
      w: 0,
      id: 'n' + Date.now(),
    }
    state.items = [...state.items, newItem]
  }
}

function deleteItem(id: string) {
  state.items = state.items.filter((i) => i.id !== id)
}

function switchHouse(h: HouseId, opts: { autoDetect?: boolean } = {}) {
  const transitingCount = state.items.reduce(
    (n, i) => n + (i.loc === 'transit' && i._transitTo === h ? 1 : 0),
    0,
  )
  if (transitingCount > 0) {
    state.items = state.items.map((it) =>
      it.loc === 'transit' && it._transitTo === h
        ? { ...it, loc: h, _transitTo: undefined }
        : it,
    )
  }
  state.house = h
  if (opts.autoDetect) {
    setToast({
      kind: 'loc',
      text: `You're at ${HOUSES[h].name} — switched${
        transitingCount > 0 ? ` · ${transitingCount} in-transit arrived` : ''
      }.`,
    })
  }
}

const summaries = computed(() => ({
  a: houseSummary(state.items, 'a'),
  b: houseSummary(state.items, 'b'),
}))

export function useWardrobe() {
  return {
    state,
    summaries,
    toast,
    setToast,
    clearToast,
    logOutfit,
    doLaundry,
    markDirty,
    markClean,
    moveItem,
    saveItem,
    deleteItem,
    switchHouse,
  }
}

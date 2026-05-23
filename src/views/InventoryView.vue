<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useItems, useCategories, usePiles, useImportItems } from '@/queries'
import { useUiStore, type InventoryFilter } from '@/stores/ui'
import { isClean, type AppItem, type AppPile } from '@/lib/types'
import { exportItems } from '@/repo'
import { downloadBackup, readBackupFile } from '@/lib/backup'
import ItemRow from '@/components/ItemRow.vue'
import PileRow from '@/components/PileRow.vue'
import SectionLabel from '@/components/SectionLabel.vue'

const router = useRouter()
const ui = useUiStore()
const { data: items, isLoading } = useItems()
const { data: categories } = useCategories()
const { data: piles } = usePiles()
const importItems = useImportItems()

// Piles are the four bulk base layers, pinned to the top because they're the
// most-touched rows. They belong to a real house, so they follow the house
// switcher. We only surface them under the unfiltered "All" view — the
// clean/dirty/category filters are about individual garments, and a pile is
// inherently a mix of both, so it has no single bucket to filter into.
const housePiles = computed<AppPile[]>(() =>
  (piles.value ?? []).filter((p) => p.house === ui.currentHouse),
)
const showPiles = computed(() => ui.filter === 'all')

// Inventory is scoped to the house you're in — consistent with the global
// switcher and the "move to other house" action. Transit items are shown
// too (they're heading to a house).
const here = computed<AppItem[]>(() =>
  (items.value ?? []).filter(
    (i) => i.house === ui.currentHouse || i.house === 'transit',
  ),
)

const filtered = computed<AppItem[]>(() => {
  const f = ui.filter
  return here.value.filter((i) => {
    if (f === 'clean') return isClean(i)
    if (f === 'dirty') return !isClean(i)
    if (typeof f === 'object') return i.categories.includes(f.category)
    return true
  })
})

const grouped = computed(() => {
  const map = new Map<string, AppItem[]>()
  for (const item of filtered.value) {
    const keys = item.categories.length ? item.categories : ['Uncategorized']
    for (const k of keys) {
      const arr = map.get(k) ?? []
      arr.push(item)
      map.set(k, arr)
    }
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
})

function isActive(f: InventoryFilter) {
  if (typeof f === 'object' && typeof ui.filter === 'object')
    return ui.filter.category === f.category
  return ui.filter === f
}

const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)

async function doExport() {
  busy.value = true
  try {
    downloadBackup(await exportItems())
    ui.pushToast('Backup exported')
  } finally {
    busy.value = false
  }
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  try {
    const parsed = await readBackupFile(file)
    const n = await importItems.mutateAsync(parsed)
    ui.pushToast(`Imported ${n} items`)
  } catch (err) {
    ui.pushToast(err instanceof Error ? err.message : 'Import failed')
  } finally {
    busy.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="scroll">
    <div class="toolbar">
      <div class="filters">
        <button :class="{ on: isActive('all') }" @click="ui.setFilter('all')">
          All
        </button>
        <button :class="{ on: isActive('clean') }" @click="ui.setFilter('clean')">
          Clean
        </button>
        <button :class="{ on: isActive('dirty') }" @click="ui.setFilter('dirty')">
          Dirty
        </button>
        <button
          v-for="c in categories ?? []"
          :key="c.id"
          :class="{ on: isActive({ category: c.name }) }"
          @click="ui.setFilter({ category: c.name })"
        >
          {{ c.name }}
        </button>
      </div>
    </div>

    <template v-if="showPiles && housePiles.length">
      <SectionLabel text="Base layers" />
      <PileRow v-for="p in housePiles" :key="p.id" :pile="p" />
    </template>

    <p v-if="isLoading" class="muted">Loading…</p>
    <p v-else-if="grouped.length === 0 && !(showPiles && housePiles.length)" class="muted empty">
      No items here. Tap + to add one.
    </p>

    <template v-for="[cat, rows] in grouped" :key="cat">
      <SectionLabel :text="cat" :count="rows.length" />
      <ItemRow v-for="it in rows" :key="it.id + cat" :item="it" />
    </template>

    <div class="backup">
      <button class="btn" :disabled="busy" @click="doExport">Export JSON</button>
      <button class="btn" :disabled="busy" @click="fileInput?.click()">
        Import JSON
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        hidden
        @change="onFile"
      />
    </div>
  </div>

  <button class="fab" @click="router.push('/inventory/new')" aria-label="Add item">
    +
  </button>
</template>

<style scoped>
.toolbar {
  position: sticky;
  top: 0;
  background: var(--bg);
  padding: 6px 0 8px;
  z-index: 1;
}
.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.filters button {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.84rem;
  color: var(--ink-soft);
  white-space: nowrap;
}
.filters button.on {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.empty {
  margin-top: 40px;
  text-align: center;
}
.backup {
  display: flex;
  gap: 10px;
  margin: 28px 0 8px;
}
.backup .btn {
  flex: 1;
  font-size: 0.88rem;
}
.fab {
  position: fixed;
  right: max(16px, calc(50% - 280px + 16px));
  bottom: calc(86px + env(safe-area-inset-bottom));
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--ink);
  color: var(--bg);
  font-size: 1.6rem;
  line-height: 1;
  z-index: 40;
}
</style>

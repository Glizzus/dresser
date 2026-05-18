<script setup lang="ts">
// Swipe a row LEFT to reveal: log a wear (daily driver), mark dirty,
// move to the other house. Tap the row to edit.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AppItem, House } from '@/lib/types'
import { isClean } from '@/lib/types'
import { useSwipe } from '@/composables/useSwipe'
import { useLogWear, useMarkDirty, useMoveItem } from '@/queries'
import { useUiStore } from '@/stores/ui'
import WearMeter from '@/components/WearMeter.vue'

const props = defineProps<{ item: AppItem }>()

const router = useRouter()
const ui = useUiStore()
const logWear = useLogWear()
const markDirty = useMarkDirty()
const moveItem = useMoveItem()

const elRef = ref<HTMLElement | null>(null)
const ACTIONS_WIDTH = 222
const { offset, bind, close } = useSwipe(elRef, { maxOffset: ACTIONS_WIDTH })

function setRef(node: Element | null) {
  bind(node as HTMLElement | null)
}

const otherHouse = (): House => {
  if (props.item.house === 'A') return 'B'
  if (props.item.house === 'B') return 'A'
  return ui.currentHouse // a transit item lands at the current house
}

function onLogWear() {
  logWear.mutate({ id: props.item.id, wears: props.item.wears })
  ui.pushToast(`Logged a wear: ${props.item.name}`)
  close()
}
function onMarkDirty() {
  markDirty.mutate({ id: props.item.id, wearLimit: props.item.wearLimit })
  close()
}
function onMove() {
  const to = otherHouse()
  moveItem.mutate({ id: props.item.id, house: to })
  ui.pushToast(`${props.item.name} → House ${to}`)
  close()
}
function onTap() {
  if (offset.value !== 0) {
    close()
    return
  }
  router.push(`/inventory/${props.item.id}`)
}
</script>

<template>
  <div class="wrap">
    <div class="actions">
      <button class="act wear" @click="onLogWear">Log wear</button>
      <button class="act dirty" @click="onMarkDirty">Mark dirty</button>
      <button class="act move">
        <span @click="onMove">→ House {{ otherHouse() }}</span>
      </button>
    </div>

    <div
      :ref="setRef"
      class="row"
      :style="{ transform: `translateX(${offset}px)` }"
      @click="onTap"
    >
      <div class="main">
        <div class="name">
          {{ item.name }}
          <span v-if="item.house === 'transit'" class="transit">in transit</span>
        </div>
        <div class="cats">{{ item.categories.join(' · ') || 'Uncategorized' }}</div>
      </div>
      <WearMeter :wears="item.wears" :wear-limit="item.wearLimit" />
      <span class="state" :class="{ dirtytag: !isClean(item) }">
        {{ isClean(item) ? '' : 'dirty' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.actions {
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
}
.act {
  border: none;
  color: #fff;
  width: 74px;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 4px;
}
.act.wear {
  background: var(--ok);
}
.act.dirty {
  background: var(--accent);
}
.act.move {
  background: var(--ink);
}
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  background: var(--bg);
  touch-action: pan-y;
  will-change: transform;
}
.main {
  flex: 1;
  min-width: 0;
}
.name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.transit {
  font-size: 0.7rem;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0 6px;
  margin-left: 6px;
}
.cats {
  font-size: 0.78rem;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.state {
  width: 0;
}
.dirtytag {
  width: auto;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
}
</style>

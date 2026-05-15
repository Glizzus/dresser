<script setup lang="ts">
import { computed, ref } from 'vue'
import { isClean } from '../lib/data'
import type { Item } from '../lib/types'
import WearMeter from './WearMeter.vue'

export interface SwipeAction {
  label: string
  icon?: string
  danger?: boolean
  onPress: () => void
}

const props = withDefaults(
  defineProps<{
    item: Item
    checked?: boolean
    toggleable?: boolean
    swipeActions?: SwipeAction[]
    showCats?: boolean
    isLast?: boolean
  }>(),
  {
    checked: false,
    toggleable: false,
    showCats: true,
    isLast: false,
    swipeActions: () => [],
  },
)

const emit = defineEmits<{
  toggle: []
  open: []
}>()

const offset = ref(0)
const startX = ref<number | null>(null)
const open = ref(false)
const actionsW = computed(() => props.swipeActions.length * 80)

const onDown = (e: PointerEvent) => {
  startX.value = e.clientX
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

const onMove = (e: PointerEvent) => {
  if (startX.value == null) return
  const dx = Math.min(0, e.clientX - startX.value + (open.value ? -actionsW.value : 0))
  if (dx < -actionsW.value) return
  offset.value = dx
}

const onUp = (e: PointerEvent) => {
  if (startX.value == null) return
  startX.value = null
  if (offset.value < -actionsW.value * 0.4) {
    offset.value = -actionsW.value
    open.value = true
  } else {
    offset.value = 0
    open.value = false
  }
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    // ignore
  }
}

const runAction = (a: SwipeAction) => {
  a.onPress()
  offset.value = 0
  open.value = false
}

const handleClick = (e: MouseEvent) => {
  if (open.value) {
    e.preventDefault()
    offset.value = 0
    open.value = false
    return
  }
  if (props.toggleable) emit('toggle')
  else emit('open')
}

const isItemClean = computed(() => isClean(props.item))
const padStyle = computed(() => ({ transform: `translateX(${offset.value}px)` }))
</script>

<template>
  <div class="wt-row" :class="isLast && 'wt-row--last'">
    <div v-if="swipeActions.length > 0" class="wt-row__actions">
      <button
        v-for="(a, i) in swipeActions"
        :key="i"
        type="button"
        class="wt-row__action"
        :class="a.danger && 'wt-row__action--danger'"
        @click="runAction(a)"
      >
        <i v-if="a.icon" :class="a.icon" />
        <span>{{ a.label }}</span>
      </button>
    </div>
    <div
      class="wt-row__pad"
      :class="startX !== null && 'wt-row__pad--dragging'"
      :style="padStyle"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @click="handleClick"
    >
      <div
        v-if="toggleable"
        class="wt-row__checkbox"
        :class="checked && 'wt-row__checkbox--checked'"
      >
        <template v-if="checked">✓</template>
      </div>
      <div class="wt-row__body">
        <div
          class="wt-row__name"
          :class="!isItemClean && 'wt-row__name--dirty'"
        >
          {{ item.name }}
        </div>
        <div v-if="showCats" class="wt-row__cats">
          {{ item.cats.join(' · ') }}
        </div>
      </div>
      <div class="wt-row__trailing">
        <slot name="trailing">
          <WearMeter :wears="item.w" :lim="item.lim" />
        </slot>
      </div>
    </div>
  </div>
</template>

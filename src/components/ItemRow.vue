<script setup lang="ts">
import { computed, ref } from 'vue'
import { isClean } from '../lib/data'
import { T } from '../lib/tokens'
import type { Item } from '../lib/types'
import WearMeter from './WearMeter.vue'

export interface SwipeAction {
  label: string
  icon?: unknown
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
</script>

<template>
  <div
    :style="{
      position: 'relative',
      overflow: 'hidden',
      background: T.surface,
      borderBottom: !isLast ? `0.5px solid ${T.div}` : 'none',
      touchAction: 'pan-y',
    }"
  >
    <div
      v-if="swipeActions.length > 0"
      :style="{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
      }"
    >
      <button
        v-for="(a, i) in swipeActions"
        :key="i"
        type="button"
        :style="{
          width: '80px',
          background: a.danger ? T.warn : T.ink2,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.1px',
        }"
        @click="runAction(a)"
      >
        <component :is="a.icon" v-if="a.icon" />
        <span>{{ a.label }}</span>
      </button>
    </div>
    <div
      class="wt-row-press"
      :style="{
        background: T.surface,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transform: `translateX(${offset}px)`,
        transition: startX !== null ? 'none' : 'transform .22s cubic-bezier(.2,.7,.2,1)',
      }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @click="handleClick"
    >
      <div
        v-if="toggleable"
        :style="{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          flexShrink: 0,
          background: checked ? T.ink : T.surface,
          boxShadow: checked ? 'none' : `inset 0 0 0 1.5px ${T.divStrong}`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          transition: 'background .12s',
        }"
      >
        <template v-if="checked">✓</template>
      </div>
      <div :style="{ flex: 1, minWidth: 0 }">
        <div
          :style="{
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '-0.2px',
            color: !isItemClean ? T.sub : T.ink,
            textDecoration: !isItemClean ? 'line-through' : 'none',
            textDecorationColor: T.faint,
          }"
        >
          {{ item.name }}
        </div>
        <div
          v-if="showCats"
          :style="{
            fontSize: '12.5px',
            color: T.sub,
            marginTop: '2px',
            letterSpacing: '-0.05px',
          }"
        >
          {{ item.cats.join(' · ') }}
        </div>
      </div>
      <div :style="{ flexShrink: 0 }">
        <slot name="trailing">
          <WearMeter :wears="item.w" :lim="item.lim" />
        </slot>
      </div>
    </div>
  </div>
</template>

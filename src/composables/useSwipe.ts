// Hand-rolled horizontal swipe-to-reveal. Pointer events, no VueUse — the
// gesture is simple enough not to warrant a dependency (per the spec, only
// reach for VueUse if this proves fiddly; it didn't).

import { onBeforeUnmount, ref, type Ref } from 'vue'

interface SwipeOptions {
  /** Px the row can travel left to expose the action tray. */
  maxOffset: number
  /** Past this fraction of maxOffset, snap fully open on release. */
  openThreshold?: number
}

export function useSwipe(el: Ref<HTMLElement | null>, opts: SwipeOptions) {
  const offset = ref(0) // negative = revealed to the left
  const open = ref(false)
  const dragging = ref(false)

  let startX = 0
  let startY = 0
  let startOffset = 0
  let axis: 'h' | 'v' | undefined
  let pointerId: number | null = null

  const threshold = opts.openThreshold ?? 0.4

  function onDown(e: PointerEvent) {
    pointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
    startOffset = open.value ? -opts.maxOffset : 0
    axis = undefined
    dragging.value = true
  }

  function onMove(e: PointerEvent) {
    if (!dragging.value || e.pointerId !== pointerId) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (!axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (axis === 'h') el.value?.setPointerCapture(e.pointerId)
    }
    if (axis !== 'h') return

    e.preventDefault()
    const next = startOffset + dx
    // Clamp: can't pull right past closed, can't over-pull left.
    offset.value = Math.max(-opts.maxOffset, Math.min(0, next))
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    dragging.value = false
    pointerId = null
    if (axis === 'h') {
      open.value = offset.value < -opts.maxOffset * threshold
      offset.value = open.value ? -opts.maxOffset : 0
    }
    axis = undefined
  }

  function close() {
    open.value = false
    offset.value = 0
  }

  function bind(node: HTMLElement | null) {
    el.value = node
    if (!node) return
    node.addEventListener('pointerdown', onDown)
    node.addEventListener('pointermove', onMove, { passive: false })
    node.addEventListener('pointerup', onUp)
    node.addEventListener('pointercancel', onUp)
  }

  onBeforeUnmount(() => {
    const node = el.value
    if (!node) return
    node.removeEventListener('pointerdown', onDown)
    node.removeEventListener('pointermove', onMove)
    node.removeEventListener('pointerup', onUp)
    node.removeEventListener('pointercancel', onUp)
  })

  return { offset, open, dragging, close, bind }
}

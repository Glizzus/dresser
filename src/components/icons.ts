import { defineComponent, h } from 'vue'

const svg = (props: Record<string, unknown>, children: ReturnType<typeof h>[]) =>
  h('svg', { fill: 'none', ...props }, children)

export const IconCheck = defineComponent({
  props: { active: Boolean },
  setup(props) {
    return () => {
      const sw = props.active ? 2 : 1.6
      return svg(
        { width: 24, height: 24, viewBox: '0 0 24 24' },
        [
          h('circle', { cx: 12, cy: 12, r: 9, stroke: 'currentColor', 'stroke-width': sw }),
          h('path', {
            d: 'M8.5 12.2l2.6 2.6 4.4-5.2',
            stroke: 'currentColor',
            'stroke-width': sw,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }),
        ],
      )
    }
  },
})

export const IconStack = defineComponent({
  props: { active: Boolean },
  setup(props) {
    return () => {
      const sw = props.active ? 2 : 1.6
      return svg(
        { width: 24, height: 24, viewBox: '0 0 24 24' },
        [
          h('rect', { x: 4, y: 5, width: 16, height: 4, rx: 1.5, stroke: 'currentColor', 'stroke-width': sw }),
          h('rect', { x: 4, y: 11, width: 16, height: 4, rx: 1.5, stroke: 'currentColor', 'stroke-width': sw }),
          h('rect', { x: 4, y: 17, width: 16, height: 2, rx: 1, stroke: 'currentColor', 'stroke-width': sw }),
        ],
      )
    }
  },
})

export const IconPulse = defineComponent({
  props: { active: Boolean },
  setup(props) {
    return () => {
      const sw = props.active ? 2 : 1.6
      return svg(
        { width: 24, height: 24, viewBox: '0 0 24 24' },
        [
          h('path', {
            d: 'M3 12h3l2-6 4 12 2-6 2 3h5',
            stroke: 'currentColor',
            'stroke-width': sw,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }),
        ],
      )
    }
  },
})

export const IconDirty = defineComponent({
  setup() {
    return () =>
      svg(
        { width: 18, height: 18, viewBox: '0 0 24 24' },
        [
          h('path', {
            d: 'M5 7l1.6 11a2 2 0 002 1.7h6.8a2 2 0 002-1.7L19 7M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2',
            stroke: 'currentColor',
            'stroke-width': 1.7,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }),
        ],
      )
  },
})

export const IconMove = defineComponent({
  setup() {
    return () =>
      svg(
        { width: 18, height: 18, viewBox: '0 0 24 24' },
        [
          h('path', {
            d: 'M4 11l3-3v2h10V8l3 3-3 3v-2H7v2l-3-3z',
            stroke: 'currentColor',
            'stroke-width': 1.7,
            'stroke-linejoin': 'round',
            fill: 'none',
          }),
        ],
      )
  },
})

export const IconLocation = defineComponent({
  setup() {
    return () =>
      svg(
        { width: 14, height: 14, viewBox: '0 0 24 24' },
        [
          h('path', {
            d: 'M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z',
            stroke: 'currentColor',
            'stroke-width': 1.7,
          }),
          h('circle', {
            cx: 12,
            cy: 9,
            r: 2.5,
            stroke: 'currentColor',
            'stroke-width': 1.7,
          }),
        ],
      )
  },
})

export const IconPlus = defineComponent({
  setup() {
    return () =>
      svg(
        { width: 20, height: 20, viewBox: '0 0 24 24' },
        [
          h('path', {
            d: 'M12 5v14M5 12h14',
            stroke: 'currentColor',
            'stroke-width': 2,
            'stroke-linecap': 'round',
          }),
        ],
      )
  },
})

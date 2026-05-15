import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from './Header.vue'
import type { HouseId, HouseSummary } from '../lib/types'

const emptySummary = (): HouseSummary => ({
  invariants: [],
  broken: 0,
  low: 0,
  warn: 0,
})

const mountHeader = (house: HouseId = 'a') =>
  mount(Header, {
    props: {
      title: 'Today',
      house,
      summaries: { a: emptySummary(), b: emptySummary() },
    },
    global: {
      stubs: {
        // PrimeVue's <Button> renders a real <button> and forwards @click,
        // but stubbing keeps the test free of PrimeVue setup (theme, etc.).
        Button: {
          inheritAttrs: false,
          template: '<button v-bind="$attrs"><slot /></button>',
        },
        Badge: true,
      },
    },
  })

describe('Header.vue', () => {
  it('emits setHouse with the clicked house id', async () => {
    const wrapper = mountHeader('a')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)

    await buttons[1].trigger('click')

    expect(wrapper.emitted('setHouse')).toEqual([['b']])
  })

  it('paints the selected house #16161C with white text', () => {
    const wrapper = mountHeader('a')
    const [active, inactive] = wrapper
      .findAll('button')
      .map((b) => b.element as HTMLButtonElement)

    expect(active.style.backgroundColor.toLowerCase()).toBe('#16161c')
    expect(active.style.color.toLowerCase()).toBe('#fff')

    expect(inactive.style.backgroundColor).toBe('')
    expect(inactive.style.color).toBe('')
  })
})

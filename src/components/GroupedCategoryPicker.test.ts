import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupedCategoryPicker from './GroupedCategoryPicker.vue'
import type { CategoryRow } from '@/lib/types'

const OPTIONS: CategoryRow[] = [
  { id: 't1', name: 'Normal Shirts' },
  { id: 't2', name: 'Church Shirts' },
  { id: 'b1', name: 'Normal Pants' },
  { id: 's1', name: 'Socks' },
]

describe('GroupedCategoryPicker', () => {
  it('renders one labelled section per non-empty group', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    const labels = wrapper.findAll('[data-group-label]').map((n) => n.text())
    expect(labels).toEqual(['Tops', 'Bottoms', 'Base layer'])
  })

  it('marks selected chips with the "on" class', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 'b1'], options: OPTIONS },
    })
    expect(wrapper.get('[data-cat-id="t1"]').classes()).toContain('on')
    expect(wrapper.get('[data-cat-id="t2"]').classes()).not.toContain('on')
    expect(wrapper.get('[data-cat-id="b1"]').classes()).toContain('on')
  })

  it('emits update:modelValue with the id added when toggling unselected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1'], options: OPTIONS },
    })
    await wrapper.get('[data-cat-id="s1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![0][0]).toEqual(['t1', 's1'])
  })

  it('emits update:modelValue with the id removed when toggling selected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 'b1'], options: OPTIONS },
    })
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits![0][0]).toEqual(['b1'])
  })
})

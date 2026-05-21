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
  it('renders one group button per non-empty group on initial mount (State A)', () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    const groups = wrapper.findAll('[data-group]').map((n) => n.attributes('data-group'))
    expect(groups).toEqual(['Tops', 'Bottoms', 'Base layer'])
    expect(wrapper.findAll('[data-cat-id]')).toHaveLength(0)
  })

  it('reveals that group\'s chips after tapping a group button (State B)', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    const chipIds = wrapper.findAll('[data-cat-id]').map((n) => n.attributes('data-cat-id'))
    expect(chipIds).toEqual(['t1', 't2'])
    expect(wrapper.findAll('[data-group]')).toHaveLength(0)
  })

  it('marks selected chips with the "on" class', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    expect(wrapper.get('[data-cat-id="t1"]').classes()).toContain('on')
    expect(wrapper.get('[data-cat-id="t2"]').classes()).not.toContain('on')
  })

  it('emits update:modelValue with the id added when toggling unselected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![0][0]).toEqual(['t1'])
  })

  it('emits update:modelValue with the id removed when toggling selected', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 't2'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="t1"]').trigger('click')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits![0][0]).toEqual(['t2'])
  })

  it('returns to State A and clears selections when "change" is tapped', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1', 't2'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-test="change-group"]').trigger('click')

    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![emits!.length - 1][0]).toEqual([])

    const groups = wrapper.findAll('[data-group]').map((n) => n.attributes('data-group'))
    expect(groups).toEqual(['Tops', 'Bottoms', 'Base layer'])
    expect(wrapper.findAll('[data-cat-id]')).toHaveLength(0)
  })

  it('shows the current group name in the change row', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: [], options: OPTIONS },
    })
    await wrapper.get('[data-group="Bottoms"]').trigger('click')
    expect(wrapper.get('[data-test="change-row"]').text()).toContain('Bottoms')
  })

  it('shows no selected chips after changing to a different group', async () => {
    const wrapper = mount(GroupedCategoryPicker, {
      props: { modelValue: ['t1'], options: OPTIONS },
    })
    await wrapper.get('[data-group="Tops"]').trigger('click')
    expect(wrapper.get('[data-cat-id="t1"]').classes()).toContain('on')

    await wrapper.get('[data-test="change-group"]').trigger('click')
    // Parent owns modelValue; emulate it honoring the cleared emit.
    await wrapper.setProps({ modelValue: [] })
    await wrapper.get('[data-group="Bottoms"]').trigger('click')

    const onChips = wrapper.findAll('[data-cat-id].on')
    expect(onChips).toHaveLength(0)
  })
})

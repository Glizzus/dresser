import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationField from './LocationField.vue'

describe('LocationField', () => {
  it('marks House A as selected when modelValue is "A"', () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    expect(wrapper.get('[data-house="A"]').classes()).toContain('on')
    expect(wrapper.get('[data-house="B"]').classes()).not.toContain('on')
    expect(wrapper.get('[data-house="transit"]').classes()).not.toContain('on')
  })

  it('marks transit as selected when modelValue is "transit"', () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'transit' } })
    expect(wrapper.get('[data-house="transit"]').classes()).toContain('on')
    expect(wrapper.get('[data-house="A"]').classes()).not.toContain('on')
  })

  it('emits update:modelValue with "B" when House B is clicked', async () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    await wrapper.get('[data-house="B"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('B')
  })

  it('emits update:modelValue with "transit" when the transit link is clicked', async () => {
    const wrapper = mount(LocationField, { props: { modelValue: 'A' } })
    await wrapper.get('[data-house="transit"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('transit')
  })
})

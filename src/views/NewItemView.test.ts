import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  createItem: vi.fn(),
  replace: vi.fn(),
  pushToast: vi.fn(),
}))

vi.mock('@/queries', async () => {
  const { ref } = await import('vue')
  const categoriesRef = ref([
    { id: 'c-shirt', name: 'Normal Shirts' },
    { id: 'c-pants', name: 'Normal Pants' },
  ])
  return {
    useCategories: () => ({ data: categoriesRef }),
    useCreateItem: () => ({ mutateAsync: mocks.createItem, isPending: ref(false) }),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({ pushToast: mocks.pushToast }),
}))

import NewItemView from './NewItemView.vue'

describe('NewItemView', () => {
  beforeEach(() => {
    mocks.createItem.mockReset().mockResolvedValue(undefined)
    mocks.replace.mockReset()
    mocks.pushToast.mockReset()
  })

  it('disables Save until name and at least one category are present', async () => {
    const wrapper = mount(NewItemView)
    const saveBtn = () => wrapper.get('[data-test="save"]')

    expect(saveBtn().attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="name"]').setValue('Blue Oxford')
    expect(saveBtn().attributes('disabled')).toBeDefined()

    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    expect(saveBtn().attributes('disabled')).toBeUndefined()
  })

  it('clamps the wear-limit decrement at 1', async () => {
    const wrapper = mount(NewItemView)
    const value = () => wrapper.get('[data-test="wear-value"]').text()
    const dec = () => wrapper.get('[data-test="wear-dec"]')

    expect(value()).toContain('2')
    await dec().trigger('click')
    expect(value()).toContain('1')
    await dec().trigger('click')
    expect(value()).toContain('1')
    expect(dec().attributes('disabled')).toBeDefined()
  })

  it('calls createItem with the trimmed draft and navigates + toasts on success', async () => {
    const wrapper = mount(NewItemView)
    await wrapper.get('[data-test="name"]').setValue('  Blue Oxford  ')
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    await wrapper.get('[data-house="B"]').trigger('click')
    await wrapper.get('[data-test="wear-inc"]').trigger('click') // 2 -> 3

    await wrapper.get('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mocks.createItem).toHaveBeenCalledTimes(1)
    expect(mocks.createItem).toHaveBeenCalledWith({
      name: 'Blue Oxford',
      categoryIds: ['c-shirt'],
      house: 'B',
      wearLimit: 3,
    })
    expect(mocks.replace).toHaveBeenCalledWith('/inventory')
    expect(mocks.pushToast).toHaveBeenCalledWith('Blue Oxford added')
  })

  it('toasts an error message and stays on the page when createItem rejects', async () => {
    mocks.createItem.mockRejectedValueOnce(new Error('Network down'))
    const wrapper = mount(NewItemView)
    await wrapper.get('[data-test="name"]').setValue('Tee')
    await wrapper.get('[data-group="Tops"]').trigger('click')
    await wrapper.get('[data-cat-id="c-shirt"]').trigger('click')
    await wrapper.get('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mocks.pushToast).toHaveBeenCalledWith("Couldn't save: Network down")
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})

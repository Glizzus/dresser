import { describe, expect, it } from 'vitest'
import { groupCategories } from './categoryGroups'
import type { CategoryRow } from '@/lib/types'

const cat = (id: string, name: string): CategoryRow => ({ id, name })

describe('groupCategories', () => {
  it('returns groups in fixed display order: Tops, Bottoms', () => {
    const result = groupCategories([
      cat('1', 'Athletic Shorts'),
      cat('2', 'Normal Pants'),
      cat('3', 'Normal Shirts'),
    ])
    expect(result.map((g) => g.group)).toEqual(['Tops', 'Bottoms'])
  })

  it('orders categories within a group by the canonical sequence', () => {
    const result = groupCategories([
      cat('b', 'Normal Shirts'),
      cat('c', 'Pajama Shirts'),
      cat('d', 'Athletic Shirts'),
      cat('e', 'Church Shirts'),
    ])
    const tops = result.find((g) => g.group === 'Tops')!
    expect(tops.items.map((i) => i.name)).toEqual([
      'Normal Shirts',
      'Church Shirts',
      'Pajama Shirts',
      'Athletic Shirts',
    ])
  })

  it('routes unknown categories to "Other", placed last', () => {
    const result = groupCategories([
      cat('1', 'Normal Shirts'),
      cat('2', 'Hats'),
    ])
    expect(result.map((g) => g.group)).toEqual(['Tops', 'Other'])
    const other = result.find((g) => g.group === 'Other')!
    expect(other.items.map((i) => i.name)).toEqual(['Hats'])
  })

  it('omits empty groups (no "Other" when all categories map)', () => {
    const result = groupCategories([cat('1', 'Normal Shirts')])
    expect(result.map((g) => g.group)).toEqual(['Tops'])
  })

  it('handles an empty input', () => {
    expect(groupCategories([])).toEqual([])
  })
})

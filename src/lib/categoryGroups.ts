// Pure grouping helper for the add-item flow. The mapping is hardcoded
// because the seeded default categories are fixed for this single-user app.
// Any category whose name is not in the mapping falls into "Other" so the
// UI never silently drops unmapped categories.

import type { CategoryRow } from '@/lib/types'

export type CategoryGroup = 'Tops' | 'Bottoms' | 'Other'

const GROUP_ORDER: CategoryGroup[] = ['Tops', 'Bottoms', 'Other']

// Base layers (undershirts, socks, underwear, tank tops) are no longer
// add-able items — they are bulk Piles, managed from the inventory list.
const MEMBERS: Record<Exclude<CategoryGroup, 'Other'>, string[]> = {
  Tops: ['Normal Shirts', 'Church Shirts', 'Pajama Shirts', 'Athletic Shirts'],
  Bottoms: ['Normal Pants', 'Church Pants', 'Pajama Pants', 'Athletic Shorts'],
}

function groupOf(name: string): CategoryGroup {
  for (const group of Object.keys(MEMBERS) as Array<keyof typeof MEMBERS>) {
    if (MEMBERS[group].includes(name)) return group
  }
  return 'Other'
}

function memberOrderIndex(group: CategoryGroup, name: string): number {
  if (group === 'Other') return 0
  const idx = MEMBERS[group].indexOf(name)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

export interface GroupedCategories {
  group: CategoryGroup
  items: CategoryRow[]
}

export function groupCategories(
  categories: CategoryRow[],
): GroupedCategories[] {
  const buckets = new Map<CategoryGroup, CategoryRow[]>()
  for (const cat of categories) {
    const group = groupOf(cat.name)
    const arr = buckets.get(group) ?? []
    arr.push(cat)
    buckets.set(group, arr)
  }
  return GROUP_ORDER.flatMap((group) => {
    const items = buckets.get(group)
    if (!items || items.length === 0) return []
    const sorted = [...items].sort(
      (a, b) => memberOrderIndex(group, a.name) - memberOrderIndex(group, b.name),
    )
    return [{ group, items: sorted }]
  })
}

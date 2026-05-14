import type {
  House,
  HouseId,
  HouseSummary,
  Invariant,
  Item,
  Outfit,
  Severity,
} from './types'

export const HOUSES: Record<HouseId, House> = {
  a: { id: 'a', name: 'House A' },
  b: { id: 'b', name: 'House B' },
}

export const CATEGORIES: string[] = [
  'Normal Shirts',
  'Normal Pants',
  'Church Shirts',
  'Church Pants',
  'Athletic Shirts',
  'Athletic Shorts',
  'Undershirts',
  'Tank Tops',
  'Pajama Shirts',
  'Pajama Pants',
  'Socks',
  'Underwear',
]

export const SEED_ITEMS: Item[] = [
  { id: 'a01', name: 'Grey crew tee', cats: ['Normal Shirts'], loc: 'a', w: 1, lim: 2 },
  { id: 'a02', name: 'Blue henley', cats: ['Normal Shirts'], loc: 'a', w: 0, lim: 2 },
  { id: 'a03', name: 'Olive tee', cats: ['Normal Shirts'], loc: 'a', w: 2, lim: 2 },
  { id: 'a04', name: 'Dark jeans', cats: ['Normal Pants'], loc: 'a', w: 2, lim: 4 },
  { id: 'a05', name: 'Khaki chinos', cats: ['Normal Pants'], loc: 'a', w: 1, lim: 4 },
  { id: 'a06', name: 'White button-up', cats: ['Church Shirts'], loc: 'a', w: 0, lim: 2 },
  { id: 'a07', name: 'Light blue oxford', cats: ['Church Shirts'], loc: 'a', w: 1, lim: 2 },
  { id: 'a08', name: 'Navy slacks', cats: ['Church Pants'], loc: 'a', w: 0, lim: 3 },
  { id: 'a09', name: 'Black undershirt', cats: ['Undershirts'], loc: 'a', w: 1, lim: 2 },
  { id: 'a10', name: 'White undershirt', cats: ['Undershirts'], loc: 'a', w: 2, lim: 2 },
  { id: 'a11', name: 'Grey undershirt', cats: ['Undershirts'], loc: 'a', w: 2, lim: 2 },
  { id: 'a12', name: 'Black tank', cats: ['Tank Tops'], loc: 'a', w: 0, lim: 2 },
  { id: 'a13', name: 'Athletic tee', cats: ['Athletic Shirts'], loc: 'a', w: 1, lim: 2 },
  { id: 'a14', name: 'Mesh shorts', cats: ['Athletic Shorts', 'Pajama Pants'], loc: 'a', w: 0, lim: 3 },
  { id: 'a15', name: 'Old soft tee', cats: ['Pajama Shirts'], loc: 'a', w: 1, lim: 4 },
  { id: 'a16', name: 'Flannel pants', cats: ['Pajama Pants'], loc: 'a', w: 2, lim: 4 },
  { id: 'a17', name: 'Black socks ×8', cats: ['Socks'], loc: 'a', w: 0, lim: 1, qty: 8 },
  { id: 'a18', name: 'White socks ×5', cats: ['Socks'], loc: 'a', w: 0, lim: 1, qty: 5 },
  { id: 'a19', name: 'Boxers ×7', cats: ['Underwear'], loc: 'a', w: 0, lim: 1, qty: 7 },
  { id: 'b01', name: 'Grey heather tee', cats: ['Normal Shirts'], loc: 'b', w: 1, lim: 2 },
  { id: 'b02', name: 'Black crew', cats: ['Normal Shirts'], loc: 'b', w: 2, lim: 2 },
  { id: 'b03', name: 'Khaki shorts', cats: ['Normal Pants'], loc: 'b', w: 0, lim: 3 },
  { id: 'b04', name: 'Black undershirt', cats: ['Undershirts'], loc: 'b', w: 2, lim: 2 },
  { id: 'b05', name: 'Faded tee', cats: ['Pajama Shirts'], loc: 'b', w: 2, lim: 4 },
  { id: 'b06', name: 'Sweat pants', cats: ['Pajama Pants'], loc: 'b', w: 2, lim: 4 },
  { id: 'b07', name: 'Black socks ×4', cats: ['Socks'], loc: 'b', w: 0, lim: 1, qty: 4 },
  { id: 'b08', name: 'Boxers ×4', cats: ['Underwear'], loc: 'b', w: 0, lim: 1, qty: 4 },
]

export const SEED_OUTFITS: Outfit[] = [
  {
    id: 'church',
    icon: '⛪',
    name: 'Church',
    catSlots: ['Church Shirts', 'Church Pants', 'Undershirts', 'Socks', 'Underwear'],
  },
  {
    id: 'casual',
    icon: '👕',
    name: 'Casual',
    catSlots: ['Normal Shirts', 'Normal Pants', 'Socks', 'Underwear'],
  },
  {
    id: 'gym',
    icon: '🏀',
    name: 'Gym',
    catSlots: ['Athletic Shirts', 'Athletic Shorts', 'Socks', 'Underwear'],
  },
  {
    id: 'pj',
    icon: '🛏️',
    name: 'Pajamas',
    catSlots: ['Pajama Shirts', 'Pajama Pants'],
  },
]

export const isClean = (it: Item): boolean => it.w < it.lim
export const atHouse = (it: Item, h: HouseId): boolean => it.loc === h

export const cleanAt = (items: Item[], h: HouseId, cat?: string): Item[] =>
  items.filter(
    (it) => atHouse(it, h) && isClean(it) && (!cat || it.cats.includes(cat)),
  )

export const dirtyAt = (items: Item[], h: HouseId): Item[] =>
  items.filter((it) => atHouse(it, h) && !isClean(it))

export function invariants(items: Item[], house: HouseId): Invariant[] {
  const minBy = (cats: string[]): { cat: string; ct: number } => {
    let m: { cat: string; ct: number } | null = null
    for (const c of cats) {
      const ct = cleanAt(items, house, c).length
      if (m === null || ct < m.ct) m = { cat: c, ct }
    }
    return m as { cat: string; ct: number }
  }

  const checks: Invariant[] = []

  // pajama set
  {
    const top = cleanAt(items, house, 'Pajama Shirts').length
    const bot = cleanAt(items, house, 'Pajama Pants').length
    const sets = Math.min(top, bot)
    const need = 1
    const sev: Severity = sets >= need ? 'ok' : 'broken'
    const bottleneck =
      top <= bot ? { cat: 'Pajama Shirts', ct: top } : { cat: 'Pajama Pants', ct: bot }
    checks.push({
      id: 'pj',
      label: 'pajama set',
      need,
      have: sets,
      severity: sev,
      detail: `${sets} clean set${sets === 1 ? '' : 's'} · need ≥${need}`,
      bottleneck,
      fix: sets < need ? `wash 1 ${bottleneck.cat.toLowerCase()}` : null,
    })
  }

  // work outfits
  {
    const c = {
      shirt: cleanAt(items, house, 'Normal Shirts').length,
      pant: cleanAt(items, house, 'Normal Pants').length,
      under: cleanAt(items, house, 'Undershirts').length,
      sock: cleanAt(items, house, 'Socks').length,
      bx: cleanAt(items, house, 'Underwear').length,
    }
    const outfits = Math.min(c.shirt, c.pant, c.under, c.sock, c.bx)
    const need = 2
    const sev: Severity = outfits >= need ? 'ok' : outfits >= 1 ? 'low' : 'broken'
    const bn = minBy(['Normal Shirts', 'Normal Pants', 'Undershirts', 'Socks', 'Underwear'])
    checks.push({
      id: 'work',
      label: 'work outfits',
      need,
      have: outfits,
      severity: sev,
      detail: `${outfits} wearable · need ≥${need}`,
      bottleneck: bn,
      fix: outfits < need ? `wash ${need - outfits} ${bn.cat.toLowerCase()}` : null,
    })
  }

  // church outfit
  {
    const c = {
      shirt: cleanAt(items, house, 'Church Shirts').length,
      pant: cleanAt(items, house, 'Church Pants').length,
      under: cleanAt(items, house, 'Undershirts').length,
    }
    const outfits = Math.min(c.shirt, c.pant, c.under)
    const need = 1
    const sev: Severity = outfits >= need ? 'ok' : 'broken'
    const bn = minBy(['Church Shirts', 'Church Pants', 'Undershirts'])
    checks.push({
      id: 'church',
      label: 'church outfit',
      need,
      have: outfits,
      severity: sev,
      detail: `${outfits} wearable · need ≥${need}`,
      bottleneck: bn,
      fix: outfits < need ? `wash 1 ${bn.cat.toLowerCase()}` : null,
    })
  }

  // socks
  {
    const have = cleanAt(items, house, 'Socks').length
    const need = 3
    const sev: Severity = have >= need ? 'ok' : have >= 1 ? 'low' : 'broken'
    checks.push({
      id: 'socks',
      label: 'sock pairs',
      need,
      have,
      severity: sev,
      detail: `${have} clean · need ≥${need}`,
      fix: have < need ? `wash ${need - have} socks` : null,
    })
  }

  // underwear
  {
    const have = cleanAt(items, house, 'Underwear').length
    const need = 3
    const sev: Severity = have >= need ? 'ok' : have >= 1 ? 'low' : 'broken'
    checks.push({
      id: 'underwear',
      label: 'underwear',
      need,
      have,
      severity: sev,
      detail: `${have} clean · need ≥${need}`,
      fix: have < need ? `wash ${need - have} underwear` : null,
    })
  }

  return checks
}

export function houseSummary(items: Item[], house: HouseId): HouseSummary {
  const inv = invariants(items, house)
  const broken = inv.filter((i) => i.severity === 'broken').length
  const low = inv.filter((i) => i.severity === 'low').length
  return { invariants: inv, broken, low, warn: broken + low }
}

export interface OutfitPick {
  cat: string
  item: Item | null
}

export function resolveOutfit(
  outfit: Outfit,
  items: Item[],
  house: HouseId,
): OutfitPick[] {
  const picks: OutfitPick[] = []
  const used = new Set<string>()
  for (const cat of outfit.catSlots) {
    const candidates = items.filter(
      (it) =>
        atHouse(it, house) && isClean(it) && it.cats.includes(cat) && !used.has(it.id),
    )
    candidates.sort((x, y) => x.w / x.lim - y.w / y.lim)
    const pick = candidates[0]
    if (pick) {
      picks.push({ cat, item: pick })
      used.add(pick.id)
    } else {
      picks.push({ cat, item: null })
    }
  }
  return picks
}

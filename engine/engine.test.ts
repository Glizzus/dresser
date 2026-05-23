// Unit tests for the pure engine. No framework, no mocks — just data.
import { describe, expect, it } from 'vitest'
import { evaluate, evaluateStatus } from './engine.ts'
import { DEFAULT_INVARIANTS } from './invariants.ts'
import { FIXTURE, PILE_FIXTURE } from './fixture.ts'
import type { Invariant, Item, Pile } from './types.ts'

// 'Normal Shirts' is a tracked-item category (NOT a pile kind), so these
// exercise the distinct-item slot path.
const shirt = (id: string, wears: number, wearLimit = 2): Item => ({
  id,
  name: id,
  categories: ['Normal Shirts'],
  house: 'A',
  wears,
  wearLimit,
})

const SHIRT_INV: Invariant = {
  id: 'shirts',
  label: '3 clean shirts',
  count: 3,
  slots: ['Normal Shirts'],
}

const SOCK_INV: Invariant = {
  id: 'sock-pairs',
  label: '3 clean sock pairs',
  count: 3,
  slots: ['Socks'],
}

const pile = (over: Partial<Pile> = {}): Pile[] => [
  { kind: 'Socks', house: 'A', total: 0, dirty: 0, ...over },
]

describe('evaluate — tracked items', () => {
  it('clean = wears < wearLimit; dirty = wears >= wearLimit', () => {
    const items = [shirt('s1', 0), shirt('s2', 1), shirt('s3', 2)]
    const r = evaluate(SHIRT_INV, items, [], 'A')
    expect(r.satisfied).toBe(false)
    expect(r.have).toBe(2) // s3 is dirty (2 >= 2)
    expect(r.bottleneck).toEqual({ category: 'Normal Shirts', shortfall: 1 })
  })

  it('within an invariant items are distinct (no double-counting)', () => {
    const multi: Item = {
      id: 'm',
      name: 'Gray Tee',
      categories: ['Normal Shirts', 'Church Shirts'],
      house: 'A',
      wears: 0,
      wearLimit: 3,
    }
    const inv: Invariant = {
      id: 't',
      label: 'shirt+shirt',
      count: 1,
      slots: ['Normal Shirts', 'Church Shirts'],
    }
    const r = evaluate(inv, [multi], [], 'A')
    // One physical shirt cannot fill both slots.
    expect(r.satisfied).toBe(false)
    expect(r.have).toBe(1)
  })

  it('honest fix: never "wash N" when nothing is dirty', () => {
    const r = evaluate(SHIRT_INV, [shirt('s1', 0)], [], 'A')
    expect(r.fix).toMatch(/none in the hamper/)
  })

  it('honest fix: "no <cat> here" when category absent entirely', () => {
    const r = evaluate(SHIRT_INV, [], [], 'A')
    expect(r.fix).toMatch(/No normal shirts at House A/)
  })

  it('honest fix: wash N when dirty inventory exists', () => {
    // have 1 (s1), need 3 → shortfall 2; two dirty shirts to wash.
    const r = evaluate(SHIRT_INV, [shirt('s1', 0), shirt('s2', 2), shirt('s3', 2)], [], 'A')
    expect(r.fix).toBe('Wash 2 dirty normal shirts.')
  })

  it('freshest-first: lowest wears are the ones assigned', () => {
    const inv: Invariant = { ...SHIRT_INV, count: 1 }
    const r = evaluate(inv, [shirt('hi', 1), shirt('lo', 0)], [], 'A')
    expect(r.satisfied).toBe(true)
  })
})

describe('evaluate — piles (bulk base layers)', () => {
  it('clean = total − dirty; satisfied when enough clean', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 5, dirty: 1 }), 'A') // 4 clean
    expect(r.satisfied).toBe(true)
    expect(r.have).toBe(3) // capped at need
  })

  it('short when clean < need', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 5, dirty: 3 }), 'A') // 2 clean
    expect(r.satisfied).toBe(false)
    expect(r.bottleneck).toEqual({ category: 'Socks', shortfall: 1 })
  })

  it('ignores piles at other houses', () => {
    const r = evaluate(
      SOCK_INV,
      [],
      [{ kind: 'Socks', house: 'B', total: 9, dirty: 0 }],
      'A',
    )
    expect(r.have).toBe(0)
  })

  it('fix: "you need some here" when the pile is empty', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 0, dirty: 0 }), 'A')
    expect(r.fix).toMatch(/No socks at House A/)
    expect(r.fix).toMatch(/you need some here/)
  })

  it('fix: "none in the hamper" when clean but short and nothing dirty', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 2, dirty: 0 }), 'A')
    expect(r.fix).toMatch(/none in the hamper/)
  })

  it('fix: wash N when enough dirty exist', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 5, dirty: 3 }), 'A') // 2 clean, short 1
    expect(r.fix).toBe('Wash 1 dirty socks.')
  })

  it('fix: wash all + still short when too few dirty', () => {
    const r = evaluate(SOCK_INV, [], pile({ total: 1, dirty: 1 }), 'A') // 0 clean, short 3
    expect(r.fix).toBe('Wash all 1 dirty socks (still short 2).')
  })
})

describe('evaluateStatus (independent readings across invariants)', () => {
  it('a shared multi-category item satisfies multiple invariants', () => {
    const a = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'A')
    const b = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'B')

    expect(a.brokenCount).toBe(4) // pajama, work, church, underwear
    expect(b.brokenCount).toBe(1) // only work-outfit

    // At House B church-outfit HOLDS while work-outfit is BROKEN even
    // though both consume the same shared dress shirt + dress pants.
    const church = b.holding.find((r) => r.id === 'church-outfit')
    const work = b.broken.find((r) => r.id === 'work-outfit')
    expect(church).toBeDefined()
    expect(work).toBeDefined()
  })

  it('transit items appear at neither house', () => {
    const a = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'A')
    const b = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'B')
    const named = [...a.hamper, ...b.hamper].flatMap((g) =>
      g.items.map((i) => i.name),
    )
    expect(named).not.toContain('Rain Jacket')
  })
})

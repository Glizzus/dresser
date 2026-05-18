// Unit tests for the pure engine. No framework, no mocks — just data.
import { describe, expect, it } from 'vitest'
import { evaluate, evaluateStatus } from './engine.ts'
import { DEFAULT_INVARIANTS } from './invariants.ts'
import { FIXTURE } from './fixture.ts'
import type { Invariant, Item } from './types.ts'

const socks = (id: string, wears: number, wearLimit = 2): Item => ({
  id,
  name: id,
  categories: ['Socks'],
  house: 'A',
  wears,
  wearLimit,
})

const SOCK_INV: Invariant = {
  id: 'sock-pairs',
  label: '3 clean sock pairs',
  count: 3,
  slots: ['Socks'],
}

describe('evaluate', () => {
  it('clean = wears < wearLimit; dirty = wears >= wearLimit', () => {
    const items = [socks('s1', 0), socks('s2', 1), socks('s3', 2)]
    const r = evaluate(SOCK_INV, items, 'A')
    expect(r.satisfied).toBe(false)
    expect(r.have).toBe(2) // s3 is dirty (2 >= 2)
    expect(r.bottleneck).toEqual({ category: 'Socks', shortfall: 1 })
  })

  it('within an invariant items are distinct (no double-counting)', () => {
    const multi: Item = {
      id: 'm',
      name: 'Gray Tee',
      categories: ['Normal Shirts', 'Undershirts'],
      house: 'A',
      wears: 0,
      wearLimit: 3,
    }
    const inv: Invariant = {
      id: 't',
      label: 'shirt+undershirt',
      count: 1,
      slots: ['Normal Shirts', 'Undershirts'],
    }
    const r = evaluate(inv, [multi], 'A')
    // One physical shirt cannot fill both slots.
    expect(r.satisfied).toBe(false)
    expect(r.have).toBe(1)
  })

  it('honest fix: never "wash N" when nothing is dirty', () => {
    const r = evaluate(SOCK_INV, [socks('s1', 0)], 'A')
    expect(r.fix).toMatch(/none in the hamper/)
  })

  it('honest fix: "no <cat> here" when category absent entirely', () => {
    const r = evaluate(SOCK_INV, [], 'A')
    expect(r.fix).toMatch(/No socks at House A/)
  })

  it('honest fix: wash N when dirty inventory exists', () => {
    // have 1 (s1), need 3 → shortfall 2; two dirty socks to wash.
    const r = evaluate(SOCK_INV, [socks('s1', 0), socks('s2', 2), socks('s3', 2)], 'A')
    expect(r.fix).toBe('Wash 2 dirty socks.')
  })

  it('freshest-first: lowest wears are the ones assigned', () => {
    const inv: Invariant = { ...SOCK_INV, count: 1 }
    const r = evaluate(inv, [socks('hi', 1), socks('lo', 0)], 'A')
    expect(r.satisfied).toBe(true)
  })
})

describe('evaluateStatus (independent readings across invariants)', () => {
  it('a shared multi-category item satisfies multiple invariants', () => {
    const a = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, 'A')
    const b = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, 'B')

    expect(a.brokenCount).toBe(5)
    expect(b.brokenCount).toBe(3)

    // At House B church-outfit HOLDS while work-outfit is BROKEN even
    // though both consume the same shared dress shirt + dress pants.
    const church = b.holding.find((r) => r.id === 'church-outfit')
    const work = b.broken.find((r) => r.id === 'work-outfit')
    expect(church).toBeDefined()
    expect(work).toBeDefined()
  })

  it('transit items appear at neither house', () => {
    const a = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, 'A')
    const b = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, 'B')
    const named = [...a.hamper, ...b.hamper].flatMap((g) =>
      g.items.map((i) => i.name),
    )
    expect(named).not.toContain('Rain Jacket')
  })
})

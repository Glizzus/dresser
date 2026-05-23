// The invariant engine — the heart of the product.
//
// Pure functions only. Signature: (invariants, items, house) -> results.
// No Vue, no Pinia, no Query, no Supabase. Trivially unit-testable.

import type {
  House,
  Invariant,
  InvariantResult,
  Item,
  Pile,
  SlotResult,
  StatusResult,
} from './types.ts';
import { isClean, isPileKind, pileClean } from './types.ts';

/** Stable freshest-first order: lowest wears first, then name for determinism. */
function byFreshest(a: Item, b: Item): number {
  if (a.wears !== b.wears) return a.wears - b.wears;
  return a.name.localeCompare(b.name);
}

/**
 * Evaluate ONE invariant against the items + piles at ONE house.
 *
 * 1. Filter to house; split clean vs dirty; bucket clean items by category.
 * 2. Fill every slot `count` times over. A base-layer slot (a pile kind) is
 *    filled from the pile's clean count; every other slot is filled with
 *    DISTINCT clean items, assigned freshest-first.
 * 3. Report satisfied, have/need, and on failure the bottleneck slot + an
 *    honest one-line fix.
 *
 * Within ONE invariant, an item is distinct: it can be assigned to at most
 * one slot here (a single physical shirt is not two clean shirts). Piles are
 * counts, not tracked items, so they need no distinctness bookkeeping. Across
 * invariants the reading is independent — see evaluateStatus.
 */
export function evaluate(
  invariant: Invariant,
  items: Item[],
  piles: Pile[],
  house: House,
): InvariantResult {
  const atHouse = items.filter((i) => i.house === house);
  const clean = atHouse.filter(isClean);
  const housePiles = piles.filter((p) => p.house === house);

  // Distinctness within this invariant: an item, once assigned to a slot,
  // is spent for the rest of THIS evaluation only.
  const used = new Set<string>();
  const slots: SlotResult[] = [];

  for (const category of invariant.slots) {
    if (isPileKind(category)) {
      const pile = housePiles.find((p) => p.kind === category);
      const available = pile ? pileClean(pile) : 0;
      slots.push({
        category,
        need: invariant.count,
        have: Math.min(available, invariant.count),
      });
      continue;
    }

    const candidates = clean
      .filter((i) => !used.has(i.id) && i.categories.includes(category))
      .sort(byFreshest)
      .slice(0, invariant.count);

    for (const c of candidates) used.add(c.id);
    slots.push({ category, need: invariant.count, have: candidates.length });
  }

  const need = invariant.count * invariant.slots.length;
  const have = slots.reduce((sum, s) => sum + s.have, 0);
  const satisfied = slots.every((s) => s.have >= s.need);

  if (satisfied) {
    return { id: invariant.id, label: invariant.label, satisfied, have, need, slots };
  }

  // Bottleneck = the slot with the worst shortfall. First slot wins ties,
  // so the message is deterministic.
  let bottleneckSlot = slots[0];
  for (const s of slots) {
    if (s.need - s.have > bottleneckSlot.need - bottleneckSlot.have) {
      bottleneckSlot = s;
    }
  }
  const shortfall = bottleneckSlot.need - bottleneckSlot.have;

  return {
    id: invariant.id,
    label: invariant.label,
    satisfied,
    have,
    need,
    slots,
    bottleneck: { category: bottleneckSlot.category, shortfall },
    fix: buildFix(bottleneckSlot.category, shortfall, atHouse, housePiles, house),
  };
}

/**
 * Honest fix line. Distinguishes:
 *  - "no <category> here" — zero items of that category at this house,
 *    clean or dirty. Washing cannot help.
 *  - dirty inventory exists — "wash N dirty <category>".
 *  - items exist but none are dirty — washing cannot help either; say so.
 * Never says "wash N" when there is nothing to wash.
 */
function buildFix(
  category: string,
  shortfall: number,
  atHouse: Item[],
  housePiles: Pile[],
  house: House,
): string {
  const noun = category.toLowerCase();

  // Pile bottleneck: same three honest cases, read off the pile's counts.
  if (isPileKind(category)) {
    const pile = housePiles.find((p) => p.kind === category);
    if (!pile || pile.total === 0) {
      return `No ${noun} at House ${house} — washing can't help; you need some here.`;
    }
    if (pile.dirty === 0) {
      return `Not enough clean ${noun} here, and none in the hamper to wash.`;
    }
    if (pile.dirty >= shortfall) {
      return `Wash ${shortfall} dirty ${noun}.`;
    }
    return `Wash all ${pile.dirty} dirty ${noun} (still short ${shortfall - pile.dirty}).`;
  }

  const inCategory = atHouse.filter((i) => i.categories.includes(category));

  if (inCategory.length === 0) {
    return `No ${noun} at House ${house} — washing can't help; you need one here.`;
  }

  const dirty = inCategory.filter((i) => !isClean(i));

  if (dirty.length === 0) {
    return `Not enough clean ${noun} here, and none in the hamper to wash.`;
  }

  if (dirty.length >= shortfall) {
    const n = shortfall;
    return `Wash ${n} dirty ${noun}.`;
  }

  return `Wash all ${dirty.length} dirty ${noun} (still short ${shortfall - dirty.length}).`;
}

/**
 * Evaluate every invariant for one house and assemble the Status view data.
 *
 * Across invariants the reading is INDEPENDENT: a clean pair of socks
 * satisfies every invariant it is eligible for. There is no allocation or
 * "spending" of items between invariants — each invariant is evaluated from
 * scratch against the full clean inventory.
 */
export function evaluateStatus(
  invariants: Invariant[],
  items: Item[],
  piles: Pile[],
  house: House,
): StatusResult {
  const results = invariants.map((inv) => evaluate(inv, items, piles, house));
  const broken = results.filter((r) => !r.satisfied);
  const holding = results.filter((r) => r.satisfied);

  // Hamper = dirty items at this house, grouped by category. A multi-category
  // item appears under every category it belongs to. Piles are deliberately
  // absent: they are bulk counts with no names to list, and a broken pile
  // invariant already carries its own "wash N dirty …" fix line.
  const dirtyHere = items.filter((i) => i.house === house && !isClean(i));
  const byCategory = new Map<string, Item[]>();
  for (const item of dirtyHere) {
    for (const category of item.categories) {
      const group = byCategory.get(category) ?? [];
      group.push(item);
      byCategory.set(category, group);
    }
  }
  const hamper = [...byCategory.entries()]
    .map(([category, group]) => ({ category, items: group }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return { house, brokenCount: broken.length, broken, holding, hamper };
}

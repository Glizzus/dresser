// Pure domain types for the invariant engine.
// NO framework imports allowed in this directory — ever.

export type House = 'A' | 'B' | 'transit';

export interface Item {
  id: string;
  name: string;
  /** One OR MORE categories. Multi-category is a first-class fact. */
  categories: string[];
  house: House;
  wears: number;
  wearLimit: number;
}

/**
 * Base layers we own in BULK and never name individually: underwear, socks,
 * etc. A pile is a count at one house, not a set of tracked garments. The four
 * kinds are hardcoded — they are the commonplace staples, fixed for this app.
 */
export const PILE_KINDS = ['Underwear', 'Socks', 'Undershirts', 'Tank Tops'] as const;
export type PileKind = (typeof PILE_KINDS)[number];

export interface Pile {
  kind: PileKind;
  /** Piles live at a real house only — never 'transit'. */
  house: 'A' | 'B';
  total: number;
  dirty: number;
}

/** Clean is DERIVED: a pile only stores total + dirty. */
export const pileClean = (p: Pile): number => p.total - p.dirty;

/** Whether an invariant slot is filled from a pile rather than named items. */
export const isPileKind = (category: string): category is PileKind =>
  (PILE_KINDS as readonly string[]).includes(category);

/**
 * Invariants are DECLARATIVE DATA. Every invariant has this exact shape
 * and is run through the one evaluator. They vary in data, not behavior.
 */
export interface Invariant {
  id: string;
  label: string;
  /** How many times over every slot must be fillable. */
  count: number;
  /** Category names; each must be fillable `count` times with distinct clean items. */
  slots: string[];
}

export interface SlotResult {
  category: string;
  need: number;
  have: number;
}

export interface Bottleneck {
  category: string;
  shortfall: number;
}

export interface InvariantResult {
  id: string;
  label: string;
  satisfied: boolean;
  /** Total distinct clean items assigned across all slots. */
  have: number;
  /** count * slots.length */
  need: number;
  slots: SlotResult[];
  /** Present only when not satisfied. */
  bottleneck?: Bottleneck;
  /** Present only when not satisfied. Honest, never says "wash N" with nothing to wash. */
  fix?: string;
}

export interface HamperGroup {
  category: string;
  items: Item[];
}

export interface StatusResult {
  house: House;
  brokenCount: number;
  broken: InvariantResult[];
  holding: InvariantResult[];
  hamper: HamperGroup[];
}

/** The settled rule: wears < wearLimit => clean; wears >= wearLimit => dirty. */
export const isClean = (item: Item): boolean => item.wears < item.wearLimit;

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

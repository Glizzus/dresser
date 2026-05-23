// App-facing types. The engine's pure types are the single source of truth
// for the domain; this module re-exports them and adds DB-row shapes that
// live ONLY behind the repo layer.

export type {
  House,
  Item,
  Pile,
  PileKind,
  Invariant,
  InvariantResult,
  SlotResult,
  Bottleneck,
  HamperGroup,
  StatusResult,
} from '@engine/types.ts'
export { isClean, pileClean, isPileKind, PILE_KINDS } from '@engine/types.ts'

import type { Item, Pile } from '@engine/types.ts'

/**
 * The app's item: the engine's Item plus the category IDs needed by the
 * edit sheet. Structurally assignable to the engine's Item, so it can be
 * fed straight into the pure engine.
 */
export interface AppItem extends Item {
  categoryIds: string[]
}

/** Raw Postgres row shapes (repo layer only). */
export interface ItemRow {
  id: string
  name: string
  house: 'A' | 'B' | 'transit'
  wears: number
  wear_limit: number
  created_at: string
  updated_at: string
}

export interface CategoryRow {
  id: string
  name: string
}

/** The app's pile: the engine's Pile plus the row id needed to mutate it. */
export interface AppPile extends Pile {
  id: string
}

/** Raw Postgres row shape for a pile (repo layer only). */
export interface PileRow {
  id: string
  house: 'A' | 'B'
  kind: Pile['kind']
  total: number
  dirty: number
}

export interface ItemCategoryRow {
  item_id: string
  category_id: string
}

/** What the edit sheet sends back when saving an item. */
export interface ItemDraft {
  name: string
  house: 'A' | 'B' | 'transit'
  wearLimit: number
  categoryIds: string[]
}

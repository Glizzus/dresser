// A small hand-built fixture for review.
//
// Garments are now tracked items; base layers (underwear/socks/undershirts/
// tank tops) are bulk PILES. The two fixtures below are chosen so the engine
// output exercises every interesting case:
//
//  - House A: several broken invariants, each with a DIFFERENT fix line
//    (pile "you need some here", pile "wash N", item "none in the hamper").
//  - House B: church-outfit HOLDS while work-outfit is BROKEN even though
//    they share the same multi-category dress shirt/pants — proving readings
//    are independent across invariants.
//  - One transit item that must appear at neither house.

import type { Item, Pile } from './types.ts';

export const FIXTURE: Item[] = [
  // ---- House A ----
  { id: 'a1', name: 'Blue Oxford',        categories: ['Normal Shirts'],                house: 'A', wears: 0, wearLimit: 2 },
  { id: 'a3', name: 'Khaki Chinos',       categories: ['Normal Pants'],                 house: 'A', wears: 0, wearLimit: 4 },
  { id: 'a8', name: 'Flannel PJ Bottoms', categories: ['Pajama Pants'],                 house: 'A', wears: 5, wearLimit: 5 }, // dirty

  // ---- House B ----
  { id: 'b1', name: 'White Dress Shirt',  categories: ['Church Shirts', 'Normal Shirts'], house: 'B', wears: 0, wearLimit: 3 }, // multi
  { id: 'b2', name: 'Black Dress Pants',  categories: ['Church Pants', 'Normal Pants'],   house: 'B', wears: 0, wearLimit: 4 }, // multi
  { id: 'b8', name: 'PJ Tee',             categories: ['Pajama Shirts'],                  house: 'B', wears: 0, wearLimit: 4 },
  { id: 'b9', name: 'PJ Pants',           categories: ['Pajama Pants'],                   house: 'B', wears: 0, wearLimit: 4 },

  // ---- In transit (must appear at NEITHER house) ----
  { id: 't1', name: 'Rain Jacket',        categories: ['Athletic Shirts'],                house: 'transit', wears: 0, wearLimit: 3 },
];

export const PILE_FIXTURE: Pile[] = [
  // House A: thin underwear (2 clean, short of 3), plenty of socks, no
  // undershirts at all.
  { kind: 'Underwear',   house: 'A', total: 5, dirty: 3 }, // 2 clean
  { kind: 'Socks',       house: 'A', total: 4, dirty: 0 }, // 4 clean
  { kind: 'Undershirts', house: 'A', total: 0, dirty: 0 }, // none here
  { kind: 'Tank Tops',   house: 'A', total: 2, dirty: 0 },

  // House B: well stocked across the board.
  { kind: 'Underwear',   house: 'B', total: 6, dirty: 1 }, // 5 clean
  { kind: 'Socks',       house: 'B', total: 5, dirty: 0 }, // 5 clean
  { kind: 'Undershirts', house: 'B', total: 3, dirty: 0 }, // 3 clean
  { kind: 'Tank Tops',   house: 'B', total: 0, dirty: 0 },
];

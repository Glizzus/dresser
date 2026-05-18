// A small hand-built fixture for Phase 1 review.
//
// 18 items across House A and House B (plus one in transit), with dirty
// items at both houses and several multi-category items. Deliberately
// chosen so the engine output exercises every interesting case:
//
//  - House A: many broken invariants, each with a DIFFERENT fix line
//    ("can't help", "none in the hamper", "wash all N (still short)").
//  - House B: church-outfit HOLDS while work-outfit is BROKEN even though
//    they share the same multi-category dress shirt/pants — proving
//    readings are independent across invariants.
//  - One transit item that must appear at neither house.

import type { Item } from './types.ts';

export const FIXTURE: Item[] = [
  // ---- House A ----
  { id: 'a1', name: 'Blue Oxford',        categories: ['Normal Shirts'],                house: 'A', wears: 0, wearLimit: 2 },
  { id: 'a2', name: 'Gray Tee',           categories: ['Normal Shirts', 'Undershirts'], house: 'A', wears: 1, wearLimit: 3 }, // multi
  { id: 'a3', name: 'Khaki Chinos',       categories: ['Normal Pants'],                 house: 'A', wears: 0, wearLimit: 4 },
  { id: 'a4', name: 'White Undershirt',   categories: ['Undershirts'],                  house: 'A', wears: 0, wearLimit: 2 },
  { id: 'a5', name: 'Ankle Socks',        categories: ['Socks'],                        house: 'A', wears: 0, wearLimit: 1 },
  { id: 'a6', name: 'Boxers Navy',        categories: ['Underwear'],                    house: 'A', wears: 0, wearLimit: 3 },
  { id: 'a7', name: 'Boxers Gray',        categories: ['Underwear'],                    house: 'A', wears: 3, wearLimit: 3 }, // dirty
  { id: 'a8', name: 'Flannel PJ Bottoms', categories: ['Pajama Pants'],                 house: 'A', wears: 5, wearLimit: 5 }, // dirty

  // ---- House B ----
  { id: 'b1', name: 'White Dress Shirt',  categories: ['Church Shirts', 'Normal Shirts'], house: 'B', wears: 0, wearLimit: 3 }, // multi
  { id: 'b2', name: 'Black Dress Pants',  categories: ['Church Pants', 'Normal Pants'],   house: 'B', wears: 0, wearLimit: 4 }, // multi
  { id: 'b3', name: 'Undershirt B',       categories: ['Undershirts'],                    house: 'B', wears: 0, wearLimit: 2 },
  { id: 'b4', name: 'Sock B1',            categories: ['Socks'],                          house: 'B', wears: 0, wearLimit: 2 },
  { id: 'b5', name: 'Sock B2',            categories: ['Socks'],                          house: 'B', wears: 0, wearLimit: 2 },
  { id: 'b6', name: 'Brief B1',           categories: ['Underwear'],                      house: 'B', wears: 0, wearLimit: 3 },
  { id: 'b7', name: 'Brief B2',           categories: ['Underwear'],                      house: 'B', wears: 2, wearLimit: 2 }, // dirty
  { id: 'b8', name: 'PJ Tee',             categories: ['Pajama Shirts'],                  house: 'B', wears: 0, wearLimit: 4 },
  { id: 'b9', name: 'PJ Pants',           categories: ['Pajama Pants'],                   house: 'B', wears: 0, wearLimit: 4 },

  // ---- In transit (must appear at NEITHER house) ----
  { id: 't1', name: 'Rain Jacket',        categories: ['Athletic Shirts'],                house: 'transit', wears: 0, wearLimit: 3 },
];

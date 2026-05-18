// Invariant DEFINITIONS live as app config — NOT as DB rows.
// Thresholds are plain numbers, deliberately easy to edit here.

import type { Invariant } from './types.ts';

export const DEFAULT_INVARIANTS: Invariant[] = [
  {
    id: 'pajama-set',
    label: '1 wearable pajama set',
    count: 1,
    slots: ['Pajama Shirts', 'Pajama Pants'],
  },
  {
    id: 'work-outfit',
    label: '2 wearable work outfits',
    count: 2,
    slots: ['Normal Shirts', 'Normal Pants', 'Undershirts', 'Socks', 'Underwear'],
  },
  {
    id: 'church-outfit',
    label: '1 church outfit',
    count: 1,
    slots: ['Church Shirts', 'Church Pants', 'Undershirts', 'Socks', 'Underwear'],
  },
  {
    id: 'sock-pairs',
    label: '3 clean sock pairs',
    count: 3,
    slots: ['Socks'],
  },
  {
    id: 'underwear',
    label: '3 clean underwear',
    count: 3,
    slots: ['Underwear'],
  },
];

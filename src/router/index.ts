// Minimal router: two tab routes + edit-as-sheet. The add-item flow is a
// standalone full-screen route (not a sheet), since it's a deliberate piece
// of work and warrants the heavier container.

import { createRouter, createWebHistory } from 'vue-router'
import InventoryView from '@/views/InventoryView.vue'
import NewItemView from '@/views/NewItemView.vue'
import StatusView from '@/views/StatusView.vue'
import ItemSheet from '@/sheets/ItemSheet.vue'
import PileSheet from '@/sheets/PileSheet.vue'
import LaundrySheet from '@/sheets/LaundrySheet.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/inventory' },
    {
      path: '/inventory',
      name: 'inventory',
      components: { default: InventoryView },
    },
    {
      path: '/inventory/new',
      name: 'item-new',
      components: { default: NewItemView },
    },
    {
      // Must precede /inventory/:id so "pile" isn't swallowed as an item id.
      path: '/inventory/pile/:id',
      name: 'pile-edit',
      components: { default: InventoryView, sheet: PileSheet },
      props: { sheet: true },
    },
    {
      path: '/inventory/:id',
      name: 'item-edit',
      components: { default: InventoryView, sheet: ItemSheet },
      props: { sheet: true },
    },
    {
      path: '/status',
      name: 'status',
      components: { default: StatusView },
    },
    {
      path: '/status/laundry',
      name: 'laundry',
      components: { default: StatusView, sheet: LaundrySheet },
    },
  ],
})

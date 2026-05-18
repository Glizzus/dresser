// Minimal router: two tab routes + sheets as routes. Sheets render into a
// named <router-view name="sheet"> overlaying the tab beneath them, so the
// tab context stays visible and Back closes the sheet.

import { createRouter, createWebHistory } from 'vue-router'
import InventoryView from '@/views/InventoryView.vue'
import StatusView from '@/views/StatusView.vue'
import ItemSheet from '@/sheets/ItemSheet.vue'
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
      components: { default: InventoryView, sheet: ItemSheet },
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

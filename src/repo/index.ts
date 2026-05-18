// Repo layer — the ONLY module tree that imports the Supabase client.
// Everything above (Query hooks, components) talks to these functions and
// never sees a Postgres row. Returns engine-shaped data.

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { AppItem, CategoryRow, House, ItemDraft } from '@/lib/types'

export { supabaseConfigured }

// ---- Auth ----------------------------------------------------------------

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb: (signedIn: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(Boolean(session))
  })
  return () => data.subscription.unsubscribe()
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

// ---- Categories ----------------------------------------------------------

export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data ?? []
}

// ---- Items ---------------------------------------------------------------

type ItemSelectRow = {
  id: string
  name: string
  house: House
  wears: number
  wear_limit: number
  item_categories: { category_id: string; categories: { name: string } | null }[]
}

const ITEM_SELECT =
  'id, name, house, wears, wear_limit, item_categories ( category_id, categories ( name ) )'

function toAppItem(row: ItemSelectRow): AppItem {
  const links = row.item_categories ?? []
  return {
    id: row.id,
    name: row.name,
    house: row.house,
    wears: row.wears,
    wearLimit: row.wear_limit,
    categories: links.map((l) => l.categories?.name ?? '').filter(Boolean),
    categoryIds: links.map((l) => l.category_id),
  }
}

export async function listItems(): Promise<AppItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .order('name')
  if (error) throw error
  return ((data ?? []) as unknown as ItemSelectRow[]).map(toAppItem)
}

async function syncCategories(itemId: string, categoryIds: string[]) {
  await supabase.from('item_categories').delete().eq('item_id', itemId)
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from('item_categories')
      .insert(categoryIds.map((category_id) => ({ item_id: itemId, category_id })))
    if (error) throw error
  }
}

export async function createItem(draft: ItemDraft): Promise<void> {
  const { data, error } = await supabase
    .from('items')
    .insert({
      name: draft.name,
      house: draft.house,
      wear_limit: draft.wearLimit,
      wears: 0,
    })
    .select('id')
    .single()
  if (error) throw error
  await syncCategories(data.id, draft.categoryIds)
}

export async function updateItem(id: string, draft: ItemDraft): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({
      name: draft.name,
      house: draft.house,
      wear_limit: draft.wearLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  await syncCategories(id, draft.categoryIds)
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

async function patchItem(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from('items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** The daily-driver gesture: one more wear. */
export async function logWear(item: { id: string; wears: number }) {
  await patchItem(item.id, { wears: item.wears + 1 })
}

/** Force dirty: push wears up to the limit. */
export async function markDirty(item: { id: string; wearLimit: number }) {
  await patchItem(item.id, { wears: item.wearLimit })
}

export async function markClean(id: string) {
  await patchItem(id, { wears: 0 })
}

export async function moveItem(id: string, house: House) {
  await patchItem(id, { house })
}

// ---- Laundry & transit ---------------------------------------------------

/** Resets wears for dirty items at the house and records the event (atomic). */
export async function doLaundry(house: 'A' | 'B'): Promise<number> {
  const { data, error } = await supabase.rpc('do_laundry', {
    target_house: house,
  })
  if (error) throw error
  return (data as number) ?? 0
}

/** Items in transit auto-arrive at the house the user just switched to. */
export async function arriveTransit(house: 'A' | 'B'): Promise<number> {
  const { data, error } = await supabase
    .from('items')
    .update({ house, updated_at: new Date().toISOString() })
    .eq('house', 'transit')
    .select('id')
  if (error) throw error
  return data?.length ?? 0
}

// ---- JSON export / import (portability backstop) -------------------------

export interface BackupItem {
  name: string
  house: House
  wears: number
  wearLimit: number
  categories: string[]
}

export async function exportItems(): Promise<BackupItem[]> {
  const items = await listItems()
  return items.map((i) => ({
    name: i.name,
    house: i.house,
    wears: i.wears,
    wearLimit: i.wearLimit,
    categories: i.categories,
  }))
}

/**
 * Re-imports a backup. Categories are matched by name (creating any that are
 * missing). Existing items are left intact — import is additive.
 */
export async function importItems(items: BackupItem[]): Promise<number> {
  const existing = await listCategories()
  const byName = new Map(existing.map((c) => [c.name, c.id]))

  for (const it of items) {
    const ids: string[] = []
    for (const name of it.categories) {
      let id = byName.get(name)
      if (!id) {
        const { data, error } = await supabase
          .from('categories')
          .insert({ name })
          .select('id')
          .single()
        if (error) throw error
        id = data.id
        byName.set(name, id)
      }
      ids.push(id)
    }
    await createItem({
      name: it.name,
      house: it.house,
      wearLimit: it.wearLimit,
      categoryIds: ids,
    })
    // Preserve wear count from the backup (createItem starts at 0).
    if (it.wears > 0) {
      const { data } = await supabase
        .from('items')
        .select('id')
        .eq('name', it.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data) await patchItem(data.id, { wears: it.wears })
    }
  }
  return items.length
}

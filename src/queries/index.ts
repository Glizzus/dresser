// TanStack Query hooks — the only thing components touch for server data.
// Each hook wraps a repo function. Every mutation invalidates the queries
// it can affect, so the UI re-derives from fresh server state.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import * as repo from '@/repo'
import type { AppItem, AppPile, House, ItemDraft } from '@/lib/types'
import type { BackupItem } from '@/repo'

export const itemsKey = ['items'] as const
export const categoriesKey = ['categories'] as const
export const pilesKey = ['piles'] as const

export function useItems() {
  return useQuery<AppItem[]>({
    queryKey: itemsKey,
    queryFn: repo.listItems,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: repo.listCategories,
  })
}

export function usePiles() {
  return useQuery<AppPile[]>({
    queryKey: pilesKey,
    queryFn: repo.listPiles,
  })
}

export const useSetPileCounts = () =>
  useInvalidatingMutation(
    (args: { id: string; patch: { total?: number; dirty?: number } }) =>
      repo.setPileCounts(args.id, args.patch),
    [pilesKey],
  )

function useInvalidatingMutation<TArgs>(
  fn: (args: TArgs) => Promise<unknown>,
  keys: readonly (readonly unknown[])[] = [itemsKey],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of keys) qc.invalidateQueries({ queryKey: key })
    },
  })
}

export const useLogWear = () =>
  useInvalidatingMutation((item: { id: string; wears: number }) =>
    repo.logWear(item),
  )

export const useMarkDirty = () =>
  useInvalidatingMutation((item: { id: string; wearLimit: number }) =>
    repo.markDirty(item),
  )

export const useMarkClean = () =>
  useInvalidatingMutation((id: string) => repo.markClean(id))

export const useMoveItem = () =>
  useInvalidatingMutation((args: { id: string; house: House }) =>
    repo.moveItem(args.id, args.house),
  )

export const useCreateItem = () =>
  useInvalidatingMutation((draft: ItemDraft) => repo.createItem(draft))

export const useUpdateItem = () =>
  useInvalidatingMutation((args: { id: string; draft: ItemDraft }) =>
    repo.updateItem(args.id, args.draft),
  )

export const useDeleteItem = () =>
  useInvalidatingMutation((id: string) => repo.deleteItem(id))

export const useDoLaundry = () =>
  useInvalidatingMutation((house: 'A' | 'B') => repo.doLaundry(house), [
    itemsKey,
    pilesKey,
  ])

export const useArriveTransit = () =>
  useInvalidatingMutation((house: 'A' | 'B') => repo.arriveTransit(house))

export const useImportItems = () =>
  useInvalidatingMutation((items: BackupItem[]) => repo.importItems(items), [
    itemsKey,
    categoriesKey,
  ])

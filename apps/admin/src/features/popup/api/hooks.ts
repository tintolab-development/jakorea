import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Popup,
  PopupCreateInput,
  PopupListFilter,
  PopupUpdateInput,
} from '@/entities/popup/model/types'
import { shouldUsePopupRemoteApi } from './capabilities'
import { popupQueryKeys } from './query-keys'
import {
  createPopupService,
  listPopupsService,
  removePopupsService,
  reorderPopupsService,
  setPopupActiveService,
  updatePopupService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUsePopupRemoteApi() ? 'remote' : 'local'
}

function collectCachedRows(queryClient: ReturnType<typeof useQueryClient>): Popup[] | undefined {
  const merged = new Map<string, Popup>()
  for (const [, rows] of queryClient.getQueriesData<Popup[]>({
    queryKey: popupQueryKeys.lists(),
  })) {
    for (const row of rows ?? []) merged.set(row.id, row)
  }
  return merged.size > 0 ? [...merged.values()] : undefined
}

function patchPopupInLists(queryClient: ReturnType<typeof useQueryClient>, popup: Popup) {
  queryClient.setQueriesData<Popup[]>({ queryKey: popupQueryKeys.lists() }, old => {
    if (!old) return old
    const idx = old.findIndex(row => row.id === popup.id)
    if (idx < 0) return old
    const next = [...old]
    next[idx] = popup
    return next
  })
}

export function usePopupsList(filter: PopupListFilter = {}, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: popupQueryKeys.list(dataSource, filter),
    queryFn: () => listPopupsService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreatePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PopupCreateInput) => createPopupService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: popupQueryKeys.lists() })
    },
  })
}

export function useUpdatePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PopupUpdateInput }) =>
      updatePopupService(id, patch, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: data => {
      patchPopupInLists(queryClient, data)
    },
  })
}

export function useRemovePopups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removePopupsService(ids, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: (_data, ids) => {
      const idSet = new Set(ids)
      queryClient.setQueriesData<Popup[]>({ queryKey: popupQueryKeys.lists() }, old =>
        (old ?? []).filter(row => !idSet.has(row.id)),
      )
    },
  })
}

export function useReorderPopups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderPopupsService(orderedIds, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(popupQueryKeys.list(source(), {}), rows)
      queryClient.setQueriesData<Popup[]>({ queryKey: popupQueryKeys.lists() }, old => {
        if (!old) return old
        const byId = new Map(rows.map(row => [row.id, row]))
        return old
          .map(row => byId.get(row.id) ?? row)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      })
    },
  })
}

export function useSetPopupActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPopupActiveService(id, isActive, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: data => {
      patchPopupInLists(queryClient, data)
    },
  })
}

export type { PopupListFilter }

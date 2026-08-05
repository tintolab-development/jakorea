import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
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

export function usePopupsList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: popupQueryKeys.list(dataSource),
    queryFn: () => listPopupsService(),
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
      updatePopupService(id, patch),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: popupQueryKeys.lists() })
    },
  })
}

export function useRemovePopups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removePopupsService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: popupQueryKeys.lists() })
    },
  })
}

export function useReorderPopups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderPopupsService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(popupQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: popupQueryKeys.lists() })
    },
  })
}

export function useSetPopupActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPopupActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: popupQueryKeys.lists() })
    },
  })
}

/** 클라이언트 필터만 적용할 때 타입 재export */
export type { PopupListFilter }

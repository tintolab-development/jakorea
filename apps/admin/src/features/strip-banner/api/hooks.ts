import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  StripBannerCreateInput,
  StripBannerListFilter,
  StripBannerUpdateInput,
} from '@/entities/strip-banner/model/types'
import { shouldUseStripBannerRemoteApi } from './capabilities'
import { stripBannerQueryKeys } from './query-keys'
import {
  createStripBannerService,
  listStripBannersService,
  removeStripBannersService,
  reorderStripBannersService,
  setStripBannerActiveService,
  updateStripBannerService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseStripBannerRemoteApi() ? 'remote' : 'local'
}

export function useStripBannersList(filter?: StripBannerListFilter, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: stripBannerQueryKeys.list(dataSource, filter),
    queryFn: () => listStripBannersService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateStripBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StripBannerCreateInput) => createStripBannerService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stripBannerQueryKeys.lists() })
    },
  })
}

export function useUpdateStripBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: StripBannerUpdateInput }) =>
      updateStripBannerService(id, patch),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stripBannerQueryKeys.lists() })
    },
  })
}

export function useRemoveStripBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeStripBannersService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stripBannerQueryKeys.lists() })
    },
  })
}

export function useReorderStripBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderStripBannersService(orderedIds),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stripBannerQueryKeys.lists() })
    },
  })
}

export function useSetStripBannerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setStripBannerActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stripBannerQueryKeys.lists() })
    },
  })
}

export type { StripBannerListFilter }

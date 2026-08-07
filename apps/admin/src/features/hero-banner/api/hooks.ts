import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { HeroBannerCreateInput, HeroBannerUpdateInput } from '@/entities/hero-banner/model/types'
import { shouldUseHeroBannerRemoteApi } from './capabilities'
import { heroBannerQueryKeys } from './query-keys'
import {
  createHeroBannerService,
  listHeroBannersService,
  removeHeroBannersService,
  reorderHeroBannersService,
  setHeroBannerActiveService,
  updateHeroBannerService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseHeroBannerRemoteApi() ? 'remote' : 'local'
}

export function useHeroBannersList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: heroBannerQueryKeys.list(dataSource),
    queryFn: () => listHeroBannersService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateHeroBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: HeroBannerCreateInput) => createHeroBannerService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: heroBannerQueryKeys.lists() })
    },
  })
}

export function useUpdateHeroBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: HeroBannerUpdateInput }) =>
      updateHeroBannerService(id, patch),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: heroBannerQueryKeys.lists() })
    },
  })
}

export function useRemoveHeroBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeHeroBannersService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: heroBannerQueryKeys.lists() })
    },
  })
}

export function useReorderHeroBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderHeroBannersService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(heroBannerQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: heroBannerQueryKeys.lists() })
    },
  })
}

export function useSetHeroBannerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setHeroBannerActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: heroBannerQueryKeys.lists() })
    },
  })
}

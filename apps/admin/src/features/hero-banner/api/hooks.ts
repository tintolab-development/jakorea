import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  HeroBanner,
  HeroBannerCreateInput,
  HeroBannerUpdateInput,
} from '@/entities/hero-banner/model/types'
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

function cachedList(queryClient: ReturnType<typeof useQueryClient>): HeroBanner[] | undefined {
  return queryClient.getQueryData<HeroBanner[]>(heroBannerQueryKeys.list(source()))
}

function patchHeroInList(
  queryClient: ReturnType<typeof useQueryClient>,
  hero: HeroBanner,
) {
  queryClient.setQueryData<HeroBanner[]>(heroBannerQueryKeys.list(source()), old => {
    if (!old) return [hero]
    const idx = old.findIndex(row => row.id === hero.id)
    if (idx < 0) return old
    const next = [...old]
    next[idx] = hero
    return next
  })
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
      updateHeroBannerService(id, patch, cachedList(queryClient)),
    retry: false,
    onSuccess: data => {
      patchHeroInList(queryClient, data)
    },
  })
}

export function useRemoveHeroBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeHeroBannersService(ids, cachedList(queryClient)),
    retry: false,
    onSuccess: (_data, ids) => {
      const idSet = new Set(ids)
      queryClient.setQueryData<HeroBanner[]>(heroBannerQueryKeys.list(source()), old =>
        (old ?? []).filter(row => !idSet.has(row.id)),
      )
    },
  })
}

export function useReorderHeroBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderHeroBannersService(orderedIds, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(heroBannerQueryKeys.list(source()), rows)
    },
  })
}

export function useSetHeroBannerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setHeroBannerActiveService(id, isActive, cachedList(queryClient)),
    retry: false,
    onSuccess: data => {
      patchHeroInList(queryClient, data)
    },
  })
}

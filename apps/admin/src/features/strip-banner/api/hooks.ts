import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  StripBanner,
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

function collectCachedRows(
  queryClient: ReturnType<typeof useQueryClient>,
): StripBanner[] | undefined {
  const merged = new Map<string, StripBanner>()
  for (const [, rows] of queryClient.getQueriesData<StripBanner[]>({
    queryKey: stripBannerQueryKeys.lists(),
  })) {
    for (const row of rows ?? []) merged.set(row.id, row)
  }
  return merged.size > 0 ? [...merged.values()] : undefined
}

function patchStripInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  banner: StripBanner,
) {
  queryClient.setQueriesData<StripBanner[]>(
    { queryKey: stripBannerQueryKeys.lists() },
    old => {
      if (!old) return old
      const idx = old.findIndex(row => row.id === banner.id)
      if (idx < 0) return old
      const next = [...old]
      next[idx] = banner
      return next
    },
  )
}

export function useStripBannersList(filter: StripBannerListFilter = {}, enabled = true) {
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
      updateStripBannerService(id, patch, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: data => {
      patchStripInLists(queryClient, data)
    },
  })
}

export function useRemoveStripBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeStripBannersService(ids, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: (_data, ids) => {
      const idSet = new Set(ids)
      queryClient.setQueriesData<StripBanner[]>(
        { queryKey: stripBannerQueryKeys.lists() },
        old => (old ?? []).filter(row => !idSet.has(row.id)),
      )
    },
  })
}

export function useReorderStripBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderStripBannersService(orderedIds, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(stripBannerQueryKeys.list(source(), {}), rows)
      queryClient.setQueriesData<StripBanner[]>(
        { queryKey: stripBannerQueryKeys.lists() },
        old => {
          if (!old) return old
          const byId = new Map(rows.map(row => [row.id, row]))
          const next = old
            .map(row => byId.get(row.id) ?? row)
            .sort((a, b) => a.sortOrder - b.sortOrder)
          return next
        },
      )
    },
  })
}

export function useSetStripBannerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setStripBannerActiveService(id, isActive, collectCachedRows(queryClient)),
    retry: false,
    onSuccess: data => {
      patchStripInLists(queryClient, data)
    },
  })
}

export type { StripBannerListFilter }

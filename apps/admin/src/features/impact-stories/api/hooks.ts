import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
  removeInfiniteListRows,
  toAdminListPage,
} from '@/shared/lib/admin-infinite-list'
import type {
  ImpactStory,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import {
  shouldUseImpactStoryCategoriesRemoteApi,
  shouldUseImpactStoriesRemoteApi,
} from './capabilities'
import { impactStoriesQueryKeys } from './query-keys'
import {
  countPinnedStoriesService,
  createStoryService,
  getStoryService,
  listCategoriesService,
  listStoriesPageService,
  removeStoriesService,
  saveCategoriesService,
  setStoryPublicService,
  updateStoryService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseImpactStoriesRemoteApi() ? 'remote' : 'local'
}

function categorySource(): 'remote' | 'local' {
  return shouldUseImpactStoryCategoriesRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: ImpactStoryListFilter): string {
  return JSON.stringify({
    v: filter.visibility ?? '',
    c: filter.categoryId ?? '',
    t: filter.title ?? '',
    a: filter.authorName ?? '',
    pf: filter.publishedFrom ?? '',
    pt: filter.publishedTo ?? '',
    cf: filter.createdFrom ?? '',
    ct: filter.createdTo ?? '',
  })
}

/** 필터별 list 캐시 분리 → 단건 패치만으로는 다른 visibility 목록이 갱신되지 않음 */
function invalidateStoryLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.lists() })
}

function mergedStoriesFromListCache(
  queryClient: ReturnType<typeof useQueryClient>,
): ImpactStory[] {
  return collectInfiniteCachedRows<ImpactStory>(queryClient, impactStoriesQueryKeys.lists()) ?? []
}

function setPinnedCounts(
  queryClient: ReturnType<typeof useQueryClient>,
  stories: ImpactStory[],
): void {
  for (const [key] of queryClient.getQueriesData({
    queryKey: [...impactStoriesQueryKeys.all, 'pin-count'] as const,
  })) {
    const excludeId =
      Array.isArray(key) && typeof key[key.length - 1] === 'string'
        ? (key[key.length - 1] as string)
        : ''
    const exclude = excludeId || undefined
    queryClient.setQueryData(
      key,
      stories.filter(s => s.isPinned && s.id !== exclude).length,
    )
  }
}

function syncPinnedCountFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  const cached = mergedStoriesFromListCache(queryClient)
  if (cached.length === 0) {
    void queryClient.invalidateQueries({
      queryKey: [...impactStoriesQueryKeys.all, 'pin-count'] as const,
    })
    return
  }
  setPinnedCounts(queryClient, cached)
}

export function useImpactStoriesList(filter: ImpactStoryListFilter, enabled = true) {
  return useAdminInfiniteList({
    queryKey: impactStoriesQueryKeys.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseImpactStoriesRemoteApi(),
    fetchPage: async page => {
      const result = await listStoriesPageService({ ...filter, page })
      return toAdminListPage(result.items, page, result)
    },
  })
}

export function useImpactStoriesPagedList(filter: ImpactStoryListFilter, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: impactStoriesQueryKeys.listPage(dataSource, filterKey(filter)),
    queryFn: () => listStoriesPageService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useImpactStoryDetail(id: string | undefined, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: impactStoriesQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getStoryService(id!),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useImpactStoryCategories(enabled = true) {
  const dataSource = categorySource()
  return useQuery({
    queryKey: impactStoriesQueryKeys.categories(dataSource),
    queryFn: () => listCategoriesService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveImpactStoryCategories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ImpactStoryCategory[]) => {
      const cached = queryClient.getQueryData<ImpactStoryCategory[]>(
        impactStoriesQueryKeys.categories(categorySource()),
      )
      return saveCategoriesService(items, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(impactStoriesQueryKeys.categories(categorySource()), data)
      invalidateStoryLists(queryClient)
    },
  })
}

export function useCreateImpactStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImpactStoryCreateInput) => createStoryService(input),
    retry: false,
    onSuccess: data => {
      invalidateStoryLists(queryClient)
      const cached = mergedStoriesFromListCache(queryClient)
      const withCreated = cached.some(row => row.id === data.id)
        ? cached.map(row => (row.id === data.id ? data : row))
        : [...cached, data]
      if (withCreated.length > 0) {
        setPinnedCounts(queryClient, withCreated)
      } else {
        void queryClient.invalidateQueries({
          queryKey: [...impactStoriesQueryKeys.all, 'pin-count'] as const,
        })
      }
    },
  })
}

export function useUpdateImpactStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImpactStoryUpdateInput) => {
      const cached = queryClient.getQueryData<ImpactStory | null>(
        impactStoriesQueryKeys.detail(source(), input.id),
      )
      return updateStoryService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(impactStoriesQueryKeys.detail(source(), data.id), data)
      patchInfiniteListRow(queryClient, impactStoriesQueryKeys.lists(), data)
      invalidateStoryLists(queryClient)
      syncPinnedCountFromCache(queryClient)
    },
  })
}

export function useRemoveImpactStories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      return removeStoriesService(ids, mergedStoriesFromListCache(queryClient))
    },
    retry: false,
    onSuccess: (_void, ids) => {
      removeInfiniteListRows(queryClient, impactStoriesQueryKeys.lists(), ids)
      syncPinnedCountFromCache(queryClient)
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: impactStoriesQueryKeys.detail(source(), id),
        })
      }
    },
  })
}

export function useSetImpactStoryPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const cached = queryClient.getQueryData<ImpactStory | null>(
        impactStoriesQueryKeys.detail(source(), id),
      )
      if (cached) {
        return setStoryPublicService(id, isPublic, cached)
      }
      const hit = mergedStoriesFromListCache(queryClient).find(row => row.id === id)
      if (hit) return setStoryPublicService(id, isPublic, hit)
      return setStoryPublicService(id, isPublic)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(impactStoriesQueryKeys.detail(source(), data.id), data)
      // 필터별 list 캐시 갱신 — categories는 건드리지 않음
      invalidateStoryLists(queryClient)
    },
  })
}

export function usePinnedImpactStoryCount(excludeId?: string, enabled = true) {
  const queryClient = useQueryClient()
  const dataSource = source()
  return useQuery({
    queryKey: [...impactStoriesQueryKeys.all, 'pin-count', dataSource, excludeId ?? ''] as const,
    queryFn: () => {
      const cached = mergedStoriesFromListCache(queryClient)
      return countPinnedStoriesService(
        excludeId,
        cached.length > 0 ? cached : undefined,
      )
    },
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

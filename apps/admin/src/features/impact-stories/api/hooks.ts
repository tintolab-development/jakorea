import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import { shouldUseImpactStoriesRemoteApi } from './capabilities'
import { impactStoriesQueryKeys } from './query-keys'
import {
  countPinnedStoriesService,
  createStoryService,
  getStoryService,
  listCategoriesService,
  listStoriesService,
  removeStoriesService,
  saveCategoriesService,
  setStoryPublicService,
  updateStoryService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseImpactStoriesRemoteApi() ? 'remote' : 'local'
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

export function useImpactStoriesList(filter: ImpactStoryListFilter, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: impactStoriesQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listStoriesService(filter),
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
  const dataSource = source()
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
    mutationFn: (items: ImpactStoryCategory[]) => saveCategoriesService(items),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(impactStoriesQueryKeys.categories(source()), data)
      void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.all })
    },
  })
}

export function useCreateImpactStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImpactStoryCreateInput) => createStoryService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.all })
    },
  })
}

export function useUpdateImpactStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImpactStoryUpdateInput) => updateStoryService(input),
    retry: false,
    onSuccess: data => {
      void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.all })
      queryClient.setQueryData(impactStoriesQueryKeys.detail(source(), data.id), data)
    },
  })
}

export function useRemoveImpactStories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeStoriesService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.all })
    },
  })
}

export function useSetImpactStoryPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      setStoryPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: impactStoriesQueryKeys.all })
    },
  })
}

export function usePinnedImpactStoryCount(excludeId?: string, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: [...impactStoriesQueryKeys.all, 'pin-count', dataSource, excludeId ?? ''] as const,
    queryFn: () => countPinnedStoriesService(excludeId),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

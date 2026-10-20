import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { getAdjacentFromStories, type AdjacentImpactStories } from '../lib/adjacent'
import {
  IMPACT_STORIES_PAGE_SIZE,
  IMPACT_STORIES_PREVIEW_SIZE,
  categoryIdFromKey,
  parsePublicStoryId,
} from '../lib/constants'
import {
  getImpactStoryAdjacentFallback,
  getImpactStoryDetailFallback,
  getImpactStoryFeaturedFallback,
  getImpactStoryListFallback,
} from '../lib/fallback'
import { filterImpactStories } from '../lib/filter-stories'
import type {
  ImpactStoriesListParams,
  ImpactStoryDetail,
  ImpactStoryDetailStatus,
  ImpactStoryListItem,
} from '../model/types'
import {
  fetchPublicImpactCategories,
  fetchPublicImpactStories,
  fetchPublicImpactStoryDetail,
} from './client'
import {
  featuredFromPreview,
  latestExcluding,
  mapPublicCategories,
  mapPublicStoryDetail,
  mapPublicStoryListItems,
  type MappedCategory,
} from './mappers'

const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000
const CATEGORY_STALE_MS = 15 * 60_000
const CATEGORY_GC_MS = 60 * 60_000
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000

export const impactStoryCategoriesQueryOptions = queryOptions({
  queryKey: platformQueryKeys.impactStory.categories(),
  queryFn: ({ signal }) => fetchPublicImpactCategories(signal),
  staleTime: CATEGORY_STALE_MS,
  gcTime: CATEGORY_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
  retryDelay: queryRetryDelay,
})

export const impactStoryPreviewQueryOptions = queryOptions({
  queryKey: platformQueryKeys.impactStory.preview(),
  queryFn: ({ signal }) =>
    fetchPublicImpactStories({ page: 0, size: IMPACT_STORIES_PREVIEW_SIZE }, signal),
  staleTime: LIST_STALE_MS,
  gcTime: LIST_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
  retryDelay: queryRetryDelay,
})

function shouldRetryDetail(failureCount: number, error: unknown): boolean {
  if (getQueryRetryHttpStatus(error) === 404) return false
  return shouldRetryQuery(failureCount, error)
}

export type ImpactStoriesListQuery = {
  items: ImpactStoryListItem[]
  totalPages: number
  totalCount: number
  currentPage: number
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
}

export type ImpactStoriesPreviewQuery = {
  items: ImpactStoryListItem[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
}

export type ImpactStoryDetailQuery = {
  data: ImpactStoryDetail | null
  status: ImpactStoryDetailStatus
  adjacent: AdjacentImpactStories
  isRemoteEnabled: boolean
  refetch: () => void
}

function paginateLocal(
  stories: readonly ImpactStoryListItem[],
  params: ImpactStoriesListParams
): Pick<ImpactStoriesListQuery, 'items' | 'totalPages' | 'totalCount' | 'currentPage'> {
  const filtered = filterImpactStories(stories, params)
  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / IMPACT_STORIES_PAGE_SIZE) || 1)
  const currentPage = Math.min(Math.max(params.page, 1), totalPages)
  const start = (currentPage - 1) * IMPACT_STORIES_PAGE_SIZE
  return {
    items: filtered.slice(start, start + IMPACT_STORIES_PAGE_SIZE),
    totalPages: totalCount === 0 ? 1 : totalPages,
    totalCount,
    currentPage,
  }
}

export function useImpactStoryCategories(): {
  items: MappedCategory[]
  isPending: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...impactStoryCategoriesQueryOptions,
    enabled: remote,
  })

  const items = useMemo(() => {
    if (!remote || query.isError || !query.data) return []
    return mapPublicCategories(query.data)
  }, [query.data, query.isError, remote])

  return { items, isPending: remote && query.isPending }
}

export function useImpactStoriesPreview(): ImpactStoriesPreviewQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...impactStoryPreviewQueryOptions,
    enabled: remote,
  })

  const items = useMemo(() => {
    if (!remote || query.isError) return getImpactStoryListFallback()
    if (query.data) return mapPublicStoryListItems(query.data.items)
    return []
  }, [query.data, query.isError, remote])

  return {
    items,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function useImpactStoriesList(params: ImpactStoriesListParams): ImpactStoriesListQuery {
  const remote = isHomepageApiConfigured()
  const { items: categories, isPending: categoriesPending } = useImpactStoryCategories()
  const categoryId = categoryIdFromKey(categories, params.category) ?? null
  const q = params.q.trim()
  const pageIndex = Math.max(params.page, 1) - 1
  const listEnabled =
    remote && (params.category === 'all' || categoryId != null || !categoriesPending)

  const query = useQuery({
    queryKey: platformQueryKeys.impactStory.list({
      categoryId,
      q,
      page: pageIndex,
      size: IMPACT_STORIES_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchPublicImpactStories(
        {
          ...(categoryId != null ? { categoryId } : {}),
          ...(q ? { q } : {}),
          page: pageIndex,
          size: IMPACT_STORIES_PAGE_SIZE,
        },
        signal
      ),
    enabled: listEnabled,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return useMemo(() => {
    if (!remote || query.isError) {
      const local = paginateLocal(getImpactStoryListFallback(), params)
      return {
        ...local,
        isRemoteEnabled: remote,
        isPending: false,
        isError: query.isError,
      }
    }

    if (!query.data) {
      return {
        items: [],
        totalPages: 1,
        totalCount: 0,
        currentPage: params.page,
        isRemoteEnabled: remote,
        isPending: query.isPending || (params.category !== 'all' && categoriesPending),
        isError: false,
      }
    }

    const totalCount = query.data.totalCount ?? 0
    const totalPages = query.data.totalPages ?? 0

    return {
      items: mapPublicStoryListItems(query.data.items),
      totalPages: totalCount === 0 ? 1 : totalPages,
      totalCount,
      currentPage: params.page,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
    }
  }, [categoriesPending, params, q, query.data, query.isError, query.isPending, remote])
}

export function useFeaturedImpactStories(): ImpactStoryListItem[] {
  const preview = useImpactStoriesPreview()
  return useMemo(() => {
    if (!preview.isRemoteEnabled || preview.isError) {
      return getImpactStoryFeaturedFallback()
    }
    if (preview.isPending) return []
    const pinned = featuredFromPreview(preview.items)
    return pinned.length > 0 ? pinned : getImpactStoryFeaturedFallback()
  }, [preview.isError, preview.isPending, preview.isRemoteEnabled, preview.items])
}

export type HomeImpactSubStoriesQuery = {
  items: ImpactStoryListItem[]
  isPending: boolean
}

export function useHomeImpactSubStories(excludeId: string | null): HomeImpactSubStoriesQuery {
  const preview = useImpactStoriesPreview()
  return useMemo(() => {
    if (!preview.isRemoteEnabled || preview.isError) {
      return {
        items: latestExcluding(getImpactStoryListFallback(), excludeId, 3),
        isPending: false,
      }
    }
    if (preview.isPending) {
      return { items: [], isPending: true }
    }
    const next = latestExcluding(preview.items, excludeId, 3)
    return {
      items: next.length > 0 ? next : latestExcluding(getImpactStoryListFallback(), excludeId, 3),
      isPending: false,
    }
  }, [excludeId, preview.isError, preview.isPending, preview.isRemoteEnabled, preview.items])
}

export function useImpactStoryDetail(id: string | null): ImpactStoryDetailQuery {
  const remote = isHomepageApiConfigured()
  const numericId = parsePublicStoryId(id)
  const enabled = remote && numericId != null

  const detailQuery = useQuery({
    queryKey: platformQueryKeys.impactStory.detail(String(numericId ?? '')),
    queryFn: ({ signal }) => fetchPublicImpactStoryDetail(numericId!, signal),
    enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryDetail,
    retryDelay: queryRetryDelay,
  })

  const preview = useImpactStoriesPreview()
  const {
    data: detailPayload,
    isPending: detailPending,
    isError: detailIsError,
    error: detailError,
    refetch: refetchDetail,
  } = detailQuery

  return useMemo(() => {
    const refetch = () => {
      void refetchDetail()
    }

    if (!id) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (!remote) {
      const data = getImpactStoryDetailFallback(id)
      return {
        data,
        status: data ? ('ready' as const) : ('not-found' as const),
        adjacent: getImpactStoryAdjacentFallback(id),
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (!enabled) {
      const data = getImpactStoryDetailFallback(id)
      return {
        data,
        status: data ? ('ready' as const) : ('not-found' as const),
        adjacent: data
          ? getImpactStoryAdjacentFallback(id)
          : { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (detailPending) {
      return {
        data: null,
        status: 'loading' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (detailIsError) {
      const statusCode = getQueryRetryHttpStatus(detailError)
      if (statusCode === 404) {
        return {
          data: null,
          status: 'not-found' as const,
          adjacent: { previous: null, next: null },
          isRemoteEnabled: remote,
          refetch,
        }
      }
      const fallback = getImpactStoryDetailFallback(id)
      if (fallback) {
        return {
          data: fallback,
          status: 'ready' as const,
          adjacent: getImpactStoryAdjacentFallback(id),
          isRemoteEnabled: remote,
          refetch,
        }
      }
      return {
        data: null,
        status: 'error' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    const data = detailPayload ? mapPublicStoryDetail(detailPayload) : null
    if (!data) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    const adjacentSource = preview.items.length > 0 ? preview.items : getImpactStoryListFallback()
    const adjacent: AdjacentImpactStories = getAdjacentFromStories(adjacentSource, data.id)

    return {
      data,
      status: 'ready' as const,
      adjacent,
      isRemoteEnabled: remote,
      refetch,
    }
  }, [
    detailError,
    detailIsError,
    detailPayload,
    detailPending,
    enabled,
    id,
    preview.items,
    refetchDetail,
    remote,
  ])
}

import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { getAdjacentFromNotices, type AdjacentNotices } from '../lib/adjacent'
import { NOTICES_PAGE_SIZE } from '../lib/constants'
import type {
  NoticeDetail,
  NoticeDetailStatus,
  NoticeListItem,
  NoticesListParams,
} from '../model/types'
import { fetchPublicNoticeDetail, fetchPublicNotices } from './client'
import {
  mapPublicNoticeDetail,
  mapPublicNoticeListItems,
  parsePublicNoticeId,
} from './mappers'

/** Class C — 공개 토글·핀·게시일 변경 가능. stale 30초. */
const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000
/** Class D — 상세 조회수 증가. stale 짧게. */
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000

/** 인접글용 preview (검색은 서버 `q` 사용). */
export const NOTICES_PREVIEW_SIZE = 20

function shouldRetryDetail(failureCount: number, error: unknown): boolean {
  if (getQueryRetryHttpStatus(error) === 404) return false
  return shouldRetryQuery(failureCount, error)
}

export type NoticesListQuery = {
  items: NoticeListItem[]
  totalPages: number
  totalCount: number
  currentPage: number
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
}

export type NoticeDetailQuery = {
  data: NoticeDetail | null
  status: NoticeDetailStatus
  adjacent: AdjacentNotices
  isRemoteEnabled: boolean
  refetch: () => void
}

const EMPTY_NOTICES_LIST: NoticesListQuery = {
  items: [],
  totalPages: 1,
  totalCount: 0,
  currentPage: 1,
  isRemoteEnabled: false,
  isPending: false,
  isError: false,
}

export const noticesPreviewQueryOptions = queryOptions({
  queryKey: platformQueryKeys.jaKorea.notices.preview(),
  queryFn: ({ signal }) =>
    fetchPublicNotices({ page: 0, size: NOTICES_PREVIEW_SIZE }, signal),
  staleTime: LIST_STALE_MS,
  gcTime: LIST_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
  retryDelay: queryRetryDelay,
})

export function useNoticesPreview(): {
  items: NoticeListItem[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...noticesPreviewQueryOptions,
    enabled: remote,
  })

  const items = useMemo(() => {
    if (!remote || query.isError || !query.data) return []
    const total =
      typeof query.data.totalCount === 'number'
        ? query.data.totalCount
        : (query.data.items?.length ?? 0)
    return mapPublicNoticeListItems(query.data.items, total, 0, NOTICES_PREVIEW_SIZE)
  }, [query.data, query.isError, remote])

  return {
    items,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function useNoticesList(params: NoticesListParams): NoticesListQuery {
  const remote = isHomepageApiConfigured()
  const q = params.q.trim()
  const pageIndex = Math.max(params.page, 1) - 1

  const query = useQuery({
    queryKey: platformQueryKeys.jaKorea.notices.list({
      q,
      page: pageIndex,
      size: NOTICES_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchPublicNotices(
        {
          ...(q ? { q } : {}),
          page: pageIndex,
          size: NOTICES_PAGE_SIZE,
        },
        signal,
      ),
    enabled: remote,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return useMemo(() => {
    if (!remote) {
      return {
        ...EMPTY_NOTICES_LIST,
        currentPage: params.page,
        isRemoteEnabled: false,
        isPending: false,
        isError: false,
      }
    }

    if (query.isError) {
      return {
        ...EMPTY_NOTICES_LIST,
        currentPage: params.page,
        isRemoteEnabled: remote,
        isPending: false,
        isError: true,
      }
    }

    if (!query.data) {
      return {
        items: [],
        totalPages: 1,
        totalCount: 0,
        currentPage: params.page,
        isRemoteEnabled: remote,
        isPending: query.isPending,
        isError: false,
      }
    }

    const totalCount =
      typeof query.data.totalCount === 'number'
        ? query.data.totalCount
        : (query.data.items?.length ?? 0)
    const totalPages =
      typeof query.data.totalPages === 'number' && query.data.totalPages > 0
        ? query.data.totalPages
        : Math.max(1, Math.ceil(totalCount / NOTICES_PAGE_SIZE) || 1)
    const currentPage = Math.min(Math.max(params.page, 1), Math.max(totalPages, 1))
    const items = mapPublicNoticeListItems(
      query.data.items,
      totalCount,
      pageIndex,
      NOTICES_PAGE_SIZE,
    )

    return {
      items,
      totalPages: totalCount === 0 ? 1 : totalPages,
      totalCount,
      currentPage,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
    }
  }, [pageIndex, params, query.data, query.isError, query.isPending, remote])
}

export function useNoticeDetail(id: string | null): NoticeDetailQuery {
  const remote = isHomepageApiConfigured()
  const numericId = parsePublicNoticeId(id)
  const enabled = remote && numericId != null

  const detailQuery = useQuery({
    queryKey: platformQueryKeys.jaKorea.notices.detail(String(numericId ?? '')),
    queryFn: ({ signal }) => fetchPublicNoticeDetail(numericId!, signal),
    enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryDetail,
    retryDelay: queryRetryDelay,
  })

  const preview = useNoticesPreview()
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
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (!enabled) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: { previous: null, next: null },
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
          status: 'unavailable' as const,
          adjacent: { previous: null, next: null },
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

    const data = detailPayload ? mapPublicNoticeDetail(detailPayload) : null
    if (!data) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: { previous: null, next: null },
        isRemoteEnabled: remote,
        refetch,
      }
    }

    const adjacentSource = preview.items.length > 0 ? preview.items : []

    return {
      data,
      status: 'ready' as const,
      adjacent: getAdjacentFromNotices(adjacentSource, data.id),
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

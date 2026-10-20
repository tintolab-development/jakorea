import { queryOptions, useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  TEXTBOOK_BUSINESS_FIELD_CODE,
  toPublicTextbookListQuery,
  type PublicTextbookListQuery,
} from '../lib/list-query'
import type { TextbookContent, TextbooksListParams } from '../model/types'
import { fetchPublicTextbook, fetchPublicTextbooks } from './client'
import {
  mapPublicTextbookDetail,
  mapPublicTextbookList,
  mergePublicTextbookDetail,
} from './mappers'

/**
 * 공개 교재 목록.
 * Class C: 관리자가 등록·수정한다.
 * Remote API only — mock fallback 없음.
 * 카테고리·정렬·페이지는 요청 쿼리가 SSOT다.
 */
const LIST_STALE_MS = 60_000
const LIST_GC_MS = 15 * 60_000
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000
/** 디렉터리용. API size 상한. 목록 페이지 크기와 다르다. */
const DIRECTORY_PAGE_SIZE = 100

const LIST_QUERY_OPTIONS = {
  staleTime: LIST_STALE_MS,
  gcTime: LIST_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
  retryDelay: queryRetryDelay,
} as const

export function publicTextbooksQueryOptions(query: PublicTextbookListQuery) {
  return queryOptions({
    queryKey: platformQueryKeys.education.textbooks(query),
    queryFn: ({ signal }) => fetchPublicTextbooks(query, signal),
    ...LIST_QUERY_OPTIONS,
  })
}

export function publicTextbookDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: platformQueryKeys.education.textbookDetail(id),
    queryFn: ({ signal }) => fetchPublicTextbook(id, signal),
    staleTime: DETAIL_STALE_MS,
    gcTime: DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export type PublicTextbookListResult = {
  items: TextbookContent[]
  totalCount: number
  totalPages: number
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function usePublicTextbookList(params: TextbooksListParams): PublicTextbookListResult {
  const remote = isHomepageApiConfigured()
  const listQuery = toPublicTextbookListQuery(params)
  const query = useQuery({
    ...publicTextbooksQueryOptions(listQuery),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }
    if (!remote) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    if (query.isPending) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        isRemoteEnabled: true,
        isPending: true,
        isError: false,
        refetch,
      }
    }
    if (query.isError) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        isRemoteEnabled: true,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    return {
      items: mapPublicTextbookList(query.data?.items),
      totalCount: query.data?.totalCount ?? 0,
      totalPages: query.data?.totalPages ?? 0,
      isRemoteEnabled: true,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query, remote])
}

const DIRECTORY_QUERIES: PublicTextbookListQuery[] = (
  Object.values(TEXTBOOK_BUSINESS_FIELD_CODE) as Array<
    (typeof TEXTBOOK_BUSINESS_FIELD_CODE)[keyof typeof TEXTBOOK_BUSINESS_FIELD_CODE]
  >
).map(fieldCode => ({
  fieldCode,
  sort: 'LATEST' as const,
  page: 0,
  size: DIRECTORY_PAGE_SIZE,
}))

/** 상단 분야 디렉터리. 분야별 최신순 1페이지(size 100). 목록 탭 필터와 분리. */
export function usePublicTextbookDirectory(): {
  items: TextbookContent[]
  isPending: boolean
  isError: boolean
  refetch: () => void
} {
  const remote = isHomepageApiConfigured()
  const queries = useQueries({
    queries: DIRECTORY_QUERIES.map(listQuery => ({
      ...publicTextbooksQueryOptions(listQuery),
      enabled: remote,
    })),
  })

  return useMemo(() => {
    const refetch = () => {
      for (const query of queries) {
        void query.refetch()
      }
    }
    if (!remote) {
      return { items: [], isPending: false, isError: true, refetch }
    }
    if (queries.some(query => query.isPending)) {
      return { items: [], isPending: true, isError: false, refetch }
    }
    if (queries.some(query => query.isError)) {
      return { items: [], isPending: false, isError: true, refetch }
    }
    return {
      items: queries.flatMap(query => mapPublicTextbookList(query.data?.items)),
      isPending: false,
      isError: false,
      refetch,
    }
  }, [queries, remote])
}

export function usePublicTextbookDetail(id: string | null, base: TextbookContent | null) {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTextbookDetailQueryOptions(id ?? ''),
    enabled: remote && Boolean(id),
  })

  const content = useMemo(() => {
    if (base) return mergePublicTextbookDetail(base, query.data)
    if (query.data) return mapPublicTextbookDetail(query.data)
    return null
  }, [base, query.data])

  return {
    content,
    isPending: remote && Boolean(id) && query.isPending,
    isError: query.isError,
  }
}

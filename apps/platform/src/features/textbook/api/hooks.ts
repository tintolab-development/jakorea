import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { TextbookContent } from '../model/types'
import { fetchPublicTextbook, fetchPublicTextbooks } from './client'
import { mapPublicTextbookList, mergePublicTextbookDetail } from './mappers'

/**
 * 공개 교재 목록.
 * Class C: 관리자가 등록·수정한다.
 * Remote API only — mock fallback 없음.
 */
const LIST_STALE_MS = 60_000
const LIST_GC_MS = 15 * 60_000
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000

export function publicTextbooksQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.education.textbooks(),
    queryFn: ({ signal }) => fetchPublicTextbooks(signal),
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
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

export function usePublicTextbookCatalog(): {
  items: TextbookContent[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTextbooksQueryOptions(),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }
    if (!remote) {
      return {
        items: [],
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    if (query.isPending) {
      return {
        items: [],
        isRemoteEnabled: true,
        isPending: true,
        isError: false,
        refetch,
      }
    }
    if (query.isError) {
      return {
        items: [],
        isRemoteEnabled: true,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    return {
      items: mapPublicTextbookList(query.data?.items),
      isRemoteEnabled: true,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query, remote])
}

export function usePublicTextbookDetail(id: string | null, base: TextbookContent | null) {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTextbookDetailQueryOptions(id ?? ''),
    enabled: remote && Boolean(id),
  })

  const content = useMemo(() => {
    if (!base) return null
    return mergePublicTextbookDetail(base, query.data)
  }, [base, query.data])

  return {
    content,
    isPending: remote && Boolean(id) && query.isPending,
    isError: query.isError,
  }
}

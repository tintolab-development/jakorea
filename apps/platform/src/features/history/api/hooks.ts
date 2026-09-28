import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { createFallbackJaHistoryView } from '../lib/fallback-view'
import { resolveHistoryMedia } from '../lib/resolve-media'
import type { HistoryPageView } from '../model/view'
import { fetchPublicJaHistoryPage } from './client'
import { mapPublicJaHistoryPage } from './mappers'

/**
 * 공개 JA History 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * stale 5분, gc 30분, 창 포커스 재조회 없음.
 */
const HISTORY_STALE_MS = 5 * 60_000
const HISTORY_GC_MS = 30 * 60_000

export function publicJaHistoryQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.jaKorea.history(),
    queryFn: ({ signal }) => fetchPublicJaHistoryPage(signal),
    staleTime: HISTORY_STALE_MS,
    gcTime: HISTORY_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function usePublicJaHistoryPage(): {
  view: HistoryPageView
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicJaHistoryQueryOptions(),
    enabled: remote,
  })

  const fallback = useMemo(() => createFallbackJaHistoryView(), [])

  const view = useMemo(() => {
    if (!remote || query.isError || !query.data) return fallback
    return mapPublicJaHistoryPage(query.data, resolveHistoryMedia, fallback)
  }, [fallback, query.data, query.isError, remote])

  return {
    view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

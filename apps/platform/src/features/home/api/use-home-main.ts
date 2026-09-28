import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchPublicMain } from './client'
import { HOME_MAIN_FALLBACK } from '../lib/fallback'
import { createPendingHomeMainView, mergePublicMainWithFallback } from '../lib/map-public-main'
import type { HomeMainQuery, HomeMainView } from '../lib/view'

function shouldRetryHomePublicMain(failureCount: number, error: unknown): boolean {
  if (!shouldRetryQuery(failureCount, error)) return false
  return failureCount < 1
}

/**
 * GET /api/public/main
 * 목록은 원격 성공 시 빈 배열을 그대로 숨긴다. 전체 fallback은 미호출·실패만.
 * 프로그램 카드는 mock 카탈로그·Homepage education.programs 를 쓰지 않는다.
 * 홈이 열려 있는 동안 1분마다 재조회. 백그라운드 탭은 멈춘다.
 */
export const homePublicMainQueryOptions = queryOptions({
  queryKey: platformQueryKeys.home.publicMain(),
  queryFn: ({ signal }) => fetchPublicMain(signal),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  retry: shouldRetryHomePublicMain,
  retryDelay: 400,
})

export function useHomeMain(): HomeMainQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...homePublicMainQueryOptions,
    enabled: remote,
  })

  const view: HomeMainView = useMemo(() => {
    if (!remote) {
      return mergePublicMainWithFallback(null, HOME_MAIN_FALLBACK)
    }
    if (query.data) {
      return mergePublicMainWithFallback(query.data, HOME_MAIN_FALLBACK)
    }
    if (query.isError) {
      return mergePublicMainWithFallback(null, HOME_MAIN_FALLBACK)
    }
    return createPendingHomeMainView(HOME_MAIN_FALLBACK)
  }, [query.data, query.isError, remote])

  return {
    ...view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}
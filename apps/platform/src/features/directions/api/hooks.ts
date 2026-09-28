import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { DirectionsInfo } from '../model/types'
import { fetchPublicDirections } from './client'
import { hasDirectionsContent, mapPublicDirections } from './mappers'

/**
 * 공개 오시는 길 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * Remote API only — mock fallback 없음.
 */
const DIRECTIONS_STALE_MS = 5 * 60_000
const DIRECTIONS_GC_MS = 30 * 60_000

export function publicDirectionsQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.jaKorea.directions(),
    queryFn: ({ signal }) => fetchPublicDirections(signal),
    staleTime: DIRECTIONS_STALE_MS,
    gcTime: DIRECTIONS_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export type PublicDirectionsQuery = {
  info: DirectionsInfo | null
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function usePublicDirections(): PublicDirectionsQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicDirectionsQueryOptions(),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }

    if (!remote) {
      return {
        info: null,
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    if (query.isPending) {
      return {
        info: null,
        isRemoteEnabled: remote,
        isPending: true,
        isError: false,
        refetch,
      }
    }

    if (query.isError) {
      return {
        info: null,
        isRemoteEnabled: remote,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    const mapped = query.data ? mapPublicDirections(query.data) : null
    return {
      info: hasDirectionsContent(mapped) ? mapped : null,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query, remote])
}

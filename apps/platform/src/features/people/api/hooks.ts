import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { PeoplePageContent } from '../model/types'
import { fetchPublicPeople } from './client'
import { hasPeopleContent, mapPublicPeople } from './mappers'

/**
 * 공개 함께하는 사람들 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * Remote API only — mock fallback 없음.
 */
const PEOPLE_STALE_MS = 5 * 60_000
const PEOPLE_GC_MS = 30 * 60_000

export function publicPeopleQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.jaKorea.people(),
    queryFn: ({ signal }) => fetchPublicPeople(signal),
    staleTime: PEOPLE_STALE_MS,
    gcTime: PEOPLE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export type PublicPeopleQuery = {
  view: PeoplePageContent | null
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function usePublicPeople(): PublicPeopleQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicPeopleQueryOptions(),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }

    if (!remote) {
      return {
        view: null,
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    if (query.isPending) {
      return {
        view: null,
        isRemoteEnabled: remote,
        isPending: true,
        isError: false,
        refetch,
      }
    }

    if (query.isError) {
      return {
        view: null,
        isRemoteEnabled: remote,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    const mapped = query.data ? mapPublicPeople(query.data) : null
    return {
      view: hasPeopleContent(mapped) ? mapped : null,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query, remote])
}

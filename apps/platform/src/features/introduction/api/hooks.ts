import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { IntroductionPageContent } from '../model/types'
import { fetchPublicOrganization } from './client'
import { applyOrganizationViewAssets } from './apply-view-assets'
import { hasOrganizationContent, mapPublicOrganization } from './mappers'

/**
 * 공개 기관소개 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * Remote API only — mock fallback 없음.
 */
const ORGANIZATION_STALE_MS = 5 * 60_000
const ORGANIZATION_GC_MS = 30 * 60_000

export function publicOrganizationQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.jaKorea.organization(),
    queryFn: ({ signal }) => fetchPublicOrganization(signal),
    staleTime: ORGANIZATION_STALE_MS,
    gcTime: ORGANIZATION_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export type PublicOrganizationQuery = {
  view: IntroductionPageContent | null
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function usePublicOrganization(): PublicOrganizationQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicOrganizationQueryOptions(),
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

    const mapped = query.data
      ? applyOrganizationViewAssets(mapPublicOrganization(query.data))
      : null
    return {
      view: hasOrganizationContent(mapped) ? mapped : null,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query, remote])
}

import { useCallback } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSponsorDetail } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

/** Class D detail — 재오픈 시 스피너 없이 캐시 우선 */
const SPONSOR_DETAIL_STALE_TIME_MS = 60_000
const SPONSOR_DETAIL_GC_TIME_MS = 10 * 60_000

export function sponsorDetailQueryOptions(sponsorId: string) {
  return queryOptions({
    queryKey: dataManagementQueryKeys.sponsors.detail(sponsorId),
    queryFn: () => getSponsorDetail(sponsorId),
    staleTime: SPONSOR_DETAIL_STALE_TIME_MS,
    gcTime: SPONSOR_DETAIL_GC_TIME_MS,
    retry: false,
  })
}

export function useSponsorDetailQuery(sponsorId: string | null, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled && Boolean(sponsorId))

  return useQuery({
    ...sponsorDetailQueryOptions(sponsorId ?? ''),
    enabled: remoteEnabled && Boolean(sponsorId),
  })
}

export function usePrefetchSponsorDetail() {
  const queryClient = useQueryClient()
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors')

  return useCallback(
    (sponsorId: string) => {
      if (!remoteEnabled || !sponsorId) return
      void queryClient.prefetchQuery(sponsorDetailQueryOptions(sponsorId))
    },
    [queryClient, remoteEnabled]
  )
}

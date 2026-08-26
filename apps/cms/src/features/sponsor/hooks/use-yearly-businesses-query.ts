import { useQuery } from '@tanstack/react-query'
import { getSponsorYearlyBusinesses } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

/** Class D 부가 리소스 — 상세 탭 마운트 시에만 fetch */
const YEARLY_STALE_TIME_MS = 60_000

export function useYearlyBusinessesQuery(sponsorId: string | null, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled(
    'sponsors',
    enabled && Boolean(sponsorId?.trim())
  )

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.yearlyBusinesses(sponsorId ?? ''),
    queryFn: () => getSponsorYearlyBusinesses(sponsorId!),
    enabled: remoteEnabled && Boolean(sponsorId?.trim()),
    staleTime: YEARLY_STALE_TIME_MS,
    retry: false,
  })
}

import { useQuery } from '@tanstack/react-query'
import { getSponsorDetail } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useSponsorDetailQuery(sponsorId: string | null, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled && Boolean(sponsorId))

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.detail(sponsorId ?? ''),
    queryFn: () => getSponsorDetail(sponsorId!),
    enabled: remoteEnabled && Boolean(sponsorId),
    staleTime: 30_000,
    retry: false,
  })
}

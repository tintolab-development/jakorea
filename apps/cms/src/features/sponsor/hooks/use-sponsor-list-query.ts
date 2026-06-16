import { useQuery } from '@tanstack/react-query'
import { getSponsorList } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useSponsorListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.list(searchParamsKey),
    queryFn: () => getSponsorList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

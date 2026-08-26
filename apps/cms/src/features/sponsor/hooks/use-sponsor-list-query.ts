import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getSponsorList } from '@/features/sponsor/api/admin-sponsors-service'
import { serializeSponsorListFilters } from '@/features/sponsor/api/sponsor-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useSponsorListQuery(searchParams: URLSearchParams, enabled = true) {
  const listFilterKey = serializeSponsorListFilters(searchParams)
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.list(listFilterKey),
    queryFn: () => getSponsorList(new URLSearchParams(listFilterKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

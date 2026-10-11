import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import { getSponsorListPage } from '@/features/sponsor/api/admin-sponsors-service'
import { serializeSponsorListFilters } from '@/features/sponsor/api/sponsor-filter-params'

export function useSponsorListQuery(searchParams: URLSearchParams, enabled = true) {
  const listFilterKey = serializeSponsorListFilters(searchParams)
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled)

  return useInfiniteLogList({
    queryKey: dataManagementQueryKeys.sponsors.list(listFilterKey),
    queryKeyIdentity: listFilterKey,
    queryFn: page =>
      getSponsorListPage(new URLSearchParams(listFilterKey), page),
    enabled: remoteEnabled,
  })
}

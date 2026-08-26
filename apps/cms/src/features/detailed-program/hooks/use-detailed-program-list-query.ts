import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDetailedProgramList } from '@/features/detailed-program/api/admin-detailed-programs-service'
import { serializeDetailedProgramListFilters } from '@/features/detailed-program/api/detailed-program-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useDetailedProgramListQuery(searchParams: URLSearchParams, enabled = true) {
  const listFilterKey = serializeDetailedProgramListFilters(searchParams)
  const remoteEnabled = useDataManagementRemoteEnabled('detailedPrograms', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.detailedPrograms.list(listFilterKey),
    queryFn: () => getDetailedProgramList(new URLSearchParams(listFilterKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

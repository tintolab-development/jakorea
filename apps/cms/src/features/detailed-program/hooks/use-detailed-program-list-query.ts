import { useQuery } from '@tanstack/react-query'
import { getDetailedProgramList } from '@/features/detailed-program/api/admin-detailed-programs-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useDetailedProgramListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useDataManagementRemoteEnabled('detailedPrograms', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.detailedPrograms.list(searchParamsKey),
    queryFn: () => getDetailedProgramList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

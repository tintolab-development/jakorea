import { useQuery } from '@tanstack/react-query'
import { getSponsorOptionsList } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useSponsorOptionsQuery(enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.options(),
    queryFn: getSponsorOptionsList,
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useSponsorSelectOptions(enabled = true) {
  const query = useSponsorOptionsQuery(enabled)
  const options = (query.data ?? []).map(row => ({
    value: row.id,
    label: row.name,
  }))
  return { ...query, options }
}

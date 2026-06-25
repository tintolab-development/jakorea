import { useQuery } from '@tanstack/react-query'
import { getMaterialKitQuantities } from '@/features/textbook/api/admin-material-kits-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useMaterialKitQuantitiesQuery(enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.textbooks.kitQuantities(),
    queryFn: getMaterialKitQuantities,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

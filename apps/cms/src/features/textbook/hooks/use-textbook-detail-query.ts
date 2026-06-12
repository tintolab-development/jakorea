import { useQuery } from '@tanstack/react-query'
import { getTextbookDetail } from '@/features/textbook/api/admin-textbooks-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useTextbookDetailQuery(id: string | null, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled && Boolean(id))

  return useQuery({
    queryKey: dataManagementQueryKeys.textbooks.detail(id ?? ''),
    queryFn: () => getTextbookDetail(id!),
    enabled: remoteEnabled && Boolean(id),
    staleTime: 30_000,
    retry: false,
  })
}

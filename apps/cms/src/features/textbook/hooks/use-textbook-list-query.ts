import { useQuery } from '@tanstack/react-query'
import {
  getTextbookList,
  getTextbookListFilterKey,
} from '@/features/textbook/api/admin-textbooks-service'
import type { TextbookListFilters } from '@/features/textbook/api/textbook-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useTextbookListQuery(filters: TextbookListFilters, enabled = true) {
  const filterKey = getTextbookListFilterKey(filters)
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.textbooks.list(filterKey),
    queryFn: () => getTextbookList(filters),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

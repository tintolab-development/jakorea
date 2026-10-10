import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import {
  getTextbookListFilterKey,
  getTextbookListPage,
} from '@/features/textbook/api/admin-textbooks-service'
import type { TextbookListFilters } from '@/features/textbook/api/textbook-filter-params'

export function useTextbookListQuery(filters: TextbookListFilters, enabled = true) {
  const filterKey = getTextbookListFilterKey(filters)
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled)

  return useInfiniteLogList({
    queryKey: dataManagementQueryKeys.textbooks.list(filterKey),
    queryKeyIdentity: filterKey,
    queryFn: page => getTextbookListPage(filters, page),
    enabled: remoteEnabled,
  })
}

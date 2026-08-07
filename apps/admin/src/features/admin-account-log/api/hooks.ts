import { useQuery } from '@tanstack/react-query'
import type { AdminAccountListFilter } from '@/entities/admin-account-log/model/types'
import { shouldUseAdminAccountLogRemoteApi } from './capabilities'
import { adminAccountLogQueryKeys } from './query-keys'
import { listAdminAccountLogsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseAdminAccountLogRemoteApi() ? 'remote' : 'local'
}

export function useAdminAccountLogsList(filter: AdminAccountListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: adminAccountLogQueryKeys.list(dataSource, filter),
    queryFn: () => listAdminAccountLogsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

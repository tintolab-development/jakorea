import { useQuery } from '@tanstack/react-query'
import type { PiiAccessListFilter } from '@/entities/pii-access-log/model/types'
import { shouldUsePiiAccessLogRemoteApi } from './capabilities'
import { piiAccessLogQueryKeys } from './query-keys'
import { listPiiAccessLogsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUsePiiAccessLogRemoteApi() ? 'remote' : 'local'
}

export function usePiiAccessLogsList(filter: PiiAccessListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: piiAccessLogQueryKeys.list(dataSource, filter),
    queryFn: () => listPiiAccessLogsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

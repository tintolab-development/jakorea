import { getMemberLoginLogsPage } from '@/features/logs/api/admin-logs-service'
import { memberLoginLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'

export function useMemberLoginHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()

  return useInfiniteLogList({
    queryKey: logsQueryKeys.memberLogins(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => {
      const apiParams = memberLoginLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getMemberLoginLogsPage(apiParams, page)
    },
    enabled,
  })
}

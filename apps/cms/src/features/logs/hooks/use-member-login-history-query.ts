import { getMemberLoginLogsPage } from '@/features/logs/api/admin-logs-service'
import { memberLoginLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useMemberLoginHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useInfiniteLogList({
    queryKey: logsQueryKeys.memberLogins(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => {
      const apiParams = memberLoginLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getMemberLoginLogsPage(apiParams, page)
    },
    enabled: remoteEnabled,
  })
}

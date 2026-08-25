import { getBugIssueLogsPage } from '@/features/logs/api/admin-logs-service'
import { bugIssueLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useBugIssueHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useInfiniteLogList({
    queryKey: logsQueryKeys.systemIssues(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => {
      const apiParams = bugIssueLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getBugIssueLogsPage(apiParams, page)
    },
    enabled: remoteEnabled,
  })
}

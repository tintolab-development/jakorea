import { useQuery } from '@tanstack/react-query'
import { getBugIssueLogsList } from '@/features/logs/api/admin-logs-service'
import { bugIssueLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useBugIssueHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: logsQueryKeys.systemIssues(searchParamsKey),
    queryFn: () => {
      const apiParams = bugIssueLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getBugIssueLogsList(apiParams)
    },
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

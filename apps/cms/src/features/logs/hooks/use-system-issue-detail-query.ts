import { useQuery } from '@tanstack/react-query'
import { getSystemIssueDetail } from '@/features/logs/api/admin-logs-service'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useSystemIssueDetailQuery(issueId: number | null, enabled = true) {
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled && issueId != null)

  return useQuery({
    queryKey: logsQueryKeys.systemIssueDetail(issueId ?? 0),
    queryFn: () => getSystemIssueDetail(issueId as number),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

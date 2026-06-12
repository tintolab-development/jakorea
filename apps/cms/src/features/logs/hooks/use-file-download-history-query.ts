import { useQuery } from '@tanstack/react-query'
import { getFileDownloadLogsList } from '@/features/logs/api/admin-logs-service'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useFileDownloadHistoryQuery(
  apiParams: Record<string, string>,
  enabled = true
) {
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: logsQueryKeys.fileAccess(apiParams),
    queryFn: () => getFileDownloadLogsList(apiParams),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

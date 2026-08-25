import { getFileDownloadLogsPage } from '@/features/logs/api/admin-logs-service'
import { fileDownloadLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function useFileDownloadHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useInfiniteLogList({
    queryKey: logsQueryKeys.fileAccess(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => {
      const apiParams = fileDownloadLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getFileDownloadLogsPage(apiParams, page)
    },
    enabled: remoteEnabled,
  })
}

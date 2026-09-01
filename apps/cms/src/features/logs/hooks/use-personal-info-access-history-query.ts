import { getPersonalInfoAccessLogsPage } from '@/features/logs/api/admin-logs-service'
import { personalInfoAccessLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function usePersonalInfoAccessHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useInfiniteLogList({
    queryKey: logsQueryKeys.privacyAccess(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => {
      const apiParams = personalInfoAccessLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getPersonalInfoAccessLogsPage(apiParams, page)
    },
    enabled: remoteEnabled,
  })
}

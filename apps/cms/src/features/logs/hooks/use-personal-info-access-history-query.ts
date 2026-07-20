import { useQuery } from '@tanstack/react-query'
import { getPersonalInfoAccessLogsList } from '@/features/logs/api/admin-logs-service'
import { personalInfoAccessLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'

export function usePersonalInfoAccessHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: logsQueryKeys.privacyAccess(searchParamsKey),
    queryFn: () => {
      const apiParams = personalInfoAccessLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getPersonalInfoAccessLogsList(apiParams)
    },
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

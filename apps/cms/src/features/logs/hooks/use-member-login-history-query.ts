import { useQuery } from '@tanstack/react-query'
import { getMemberLoginLogsList } from '@/features/logs/api/admin-logs-service'
import { memberLoginLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'

export function useMemberLoginHistoryQuery(
  searchParams: URLSearchParams,
  enabled = true
) {
  const searchParamsKey = searchParams.toString()

  return useQuery({
    queryKey: logsQueryKeys.memberLogins(searchParamsKey),
    queryFn: () => {
      const apiParams = memberLoginLogsParamsFromSearchParams(
        new URLSearchParams(searchParamsKey)
      )
      return getMemberLoginLogsList(apiParams)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

import { useQuery } from '@tanstack/react-query'
import { getAlimtalkSendHistoryList } from '@/features/notifications/api/alimtalk-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

export function useAlimtalkSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()

  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSendHistory.list(searchParamsKey),
    queryFn: () => getAlimtalkSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
  })
}

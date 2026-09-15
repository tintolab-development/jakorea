import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAlimtalkSendHistoryDetail,
  getAlimtalkSendHistoryList,
} from '@/features/notifications/api/alimtalk-send-history-service'
import {
  DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS,
  markNotificationDeliveryListAwaitingDispatch,
} from '@/features/notifications/api/delivery-list-refresh'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { alimtalkSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'

/** Class E — soft nav 캐시 hit 금지 · 발송 직후 dispatch 지연 흡수 */
const LIST_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  retry: false as const,
}

export function useAlimtalkSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = alimtalkSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('alimtalk')

  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSendHistory.list(searchParamsKey),
    queryFn: () => getAlimtalkSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    ...LIST_QUERY_OPTIONS,
    refetchInterval: shortPoll ? DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS : false,
  })
}

export function useAlimtalkSendHistoryDetailQuery(deliveryId: string | null, enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSendHistory.detail(deliveryId ?? ''),
    queryFn: () => getAlimtalkSendHistoryDetail(deliveryId!),
    enabled: enabled && Boolean(deliveryId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useInvalidateAlimtalkSendHistory() {
  const queryClient = useQueryClient()
  return () => {
    markNotificationDeliveryListAwaitingDispatch('alimtalk')
    return queryClient.invalidateQueries({
      queryKey: notificationsQueryKeys.alimtalkSendHistory.all(),
    })
  }
}

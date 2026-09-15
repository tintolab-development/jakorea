import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS,
  markNotificationDeliveryListAwaitingDispatch,
} from '@/features/notifications/api/delivery-list-refresh'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { smsSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import {
  getSmsSendHistoryDetail,
  getSmsSendHistoryList,
} from '@/features/notifications/api/sms-send-history-service'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'

/** Class E — soft nav 캐시 hit 금지 · 발송 직후 dispatch 지연 흡수 */
const LIST_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  retry: false as const,
}

export function useSmsSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = smsSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('sms')

  return useQuery({
    queryKey: notificationsQueryKeys.smsSendHistory.list(searchParamsKey),
    queryFn: () => getSmsSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    ...LIST_QUERY_OPTIONS,
    refetchInterval: shortPoll ? DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS : false,
  })
}

export function useSmsSendHistoryDetailQuery(deliveryId: string | null, enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.smsSendHistory.detail(deliveryId ?? ''),
    queryFn: () => getSmsSendHistoryDetail(deliveryId!),
    enabled: enabled && Boolean(deliveryId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useInvalidateSmsSendHistory() {
  const queryClient = useQueryClient()
  return () => {
    markNotificationDeliveryListAwaitingDispatch('sms')
    return queryClient.invalidateQueries({
      queryKey: notificationsQueryKeys.smsSendHistory.all(),
    })
  }
}

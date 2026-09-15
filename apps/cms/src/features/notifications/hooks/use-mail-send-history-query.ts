import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS,
  markNotificationDeliveryListAwaitingDispatch,
} from '@/features/notifications/api/delivery-list-refresh'
import {
  getMailSendHistoryDetail,
  getMailSendHistoryList,
} from '@/features/notifications/api/mail-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { mailSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'

/** Class E — soft nav 캐시 hit 금지 · 발송 직후 dispatch 지연 흡수 */
const LIST_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  retry: false as const,
}

export function useMailSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = mailSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('mail')

  return useQuery({
    queryKey: notificationsQueryKeys.mailSendHistory.list(searchParamsKey),
    queryFn: () => getMailSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    ...LIST_QUERY_OPTIONS,
    refetchInterval: shortPoll ? DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS : false,
  })
}

export function useMailSendHistoryDetailQuery(deliveryId: string | null, enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.mailSendHistory.detail(deliveryId ?? ''),
    queryFn: () => getMailSendHistoryDetail(deliveryId!),
    enabled: enabled && Boolean(deliveryId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useInvalidateMailSendHistory() {
  const queryClient = useQueryClient()
  return () => {
    markNotificationDeliveryListAwaitingDispatch('mail')
    return queryClient.invalidateQueries({
      queryKey: notificationsQueryKeys.mailSendHistory.all(),
    })
  }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { markNotificationDeliveryListAwaitingDispatch } from '@/features/notifications/api/delivery-list-refresh'
import {
  getMailSendHistoryDetail,
  getMailSendHistoryList,
} from '@/features/notifications/api/mail-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { mailSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'
import { useInfiniteSendHistoryQuery } from '@/features/notifications/hooks/use-infinite-send-history'

export function useMailSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = mailSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('mail')

  return useInfiniteSendHistoryQuery({
    queryKey: notificationsQueryKeys.mailSendHistory.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => getMailSendHistoryList(new URLSearchParams(searchParamsKey), page),
    enabled,
    shortPoll,
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

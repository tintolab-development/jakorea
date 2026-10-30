import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { markNotificationDeliveryListAwaitingDispatch } from '@/features/notifications/api/delivery-list-refresh'
import { notificationDeliveryDetailQueryCache } from '@/features/notifications/api/notification-delivery-detail-cache'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { smsSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import {
  getSmsSendHistoryDetail,
  getSmsSendHistoryList,
} from '@/features/notifications/api/sms-send-history-service'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'
import { useInfiniteSendHistoryQuery } from '@/features/notifications/hooks/use-infinite-send-history'

export function useSmsSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = smsSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('sms')

  return useInfiniteSendHistoryQuery({
    queryKey: notificationsQueryKeys.smsSendHistory.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => getSmsSendHistoryList(new URLSearchParams(searchParamsKey), page),
    enabled,
    shortPoll,
  })
}

export function useSmsSendHistoryDetailQuery(deliveryId: string | null, enabled = true) {
  const queryClient = useQueryClient()
  const id = deliveryId ?? ''
  const queryKey = notificationsQueryKeys.smsSendHistory.detail(id)
  useEffect(() => {
    if (!id) return
    return () => {
      queryClient.removeQueries({
        queryKey: notificationsQueryKeys.smsSendHistory.detail(id),
      })
    }
  }, [id, queryClient])
  return useQuery({
    queryKey,
    queryFn: () => getSmsSendHistoryDetail(deliveryId!),
    enabled: enabled && Boolean(deliveryId),
    ...notificationDeliveryDetailQueryCache,
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

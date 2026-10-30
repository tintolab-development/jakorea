import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationDeliveryDetailQueryCache } from '@/features/notifications/api/notification-delivery-detail-cache'
import {
  getAlimtalkSendHistoryDetail,
  getAlimtalkSendHistoryList,
} from '@/features/notifications/api/alimtalk-send-history-service'
import { markNotificationDeliveryListAwaitingDispatch } from '@/features/notifications/api/delivery-list-refresh'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { alimtalkSendHistorySearchParamsKey } from '@/features/notifications/api/send-history-search-params-key'
import { useDeliveryListShortPoll } from '@/features/notifications/hooks/use-delivery-list-short-poll'
import { useInfiniteSendHistoryQuery } from '@/features/notifications/hooks/use-infinite-send-history'

export function useAlimtalkSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = alimtalkSendHistorySearchParamsKey(searchParams)
  const shortPoll = useDeliveryListShortPoll('alimtalk')

  return useInfiniteSendHistoryQuery({
    queryKey: notificationsQueryKeys.alimtalkSendHistory.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => getAlimtalkSendHistoryList(new URLSearchParams(searchParamsKey), page),
    enabled,
    shortPoll,
  })
}

export function useAlimtalkSendHistoryDetailQuery(deliveryId: string | null, enabled = true) {
  const queryClient = useQueryClient()
  const id = deliveryId ?? ''
  const queryKey = notificationsQueryKeys.alimtalkSendHistory.detail(id)
  useEffect(() => {
    if (!id) return
    return () => {
      queryClient.removeQueries({
        queryKey: notificationsQueryKeys.alimtalkSendHistory.detail(id),
      })
    }
  }, [id, queryClient])
  return useQuery({
    queryKey,
    queryFn: () => getAlimtalkSendHistoryDetail(deliveryId!),
    enabled: enabled && Boolean(deliveryId),
    ...notificationDeliveryDetailQueryCache,
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

import { useQuery } from '@tanstack/react-query'
import {
  getAlimtalkSendHistoryDetail,
  getAlimtalkSendHistoryList,
} from '@/features/notifications/api/alimtalk-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

export function useAlimtalkSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()

  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSendHistory.list(searchParamsKey),
    queryFn: () => getAlimtalkSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
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

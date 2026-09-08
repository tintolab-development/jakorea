import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSmsSendHistoryDetail,
  getSmsSendHistoryList,
} from '@/features/notifications/api/sms-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

export function useSmsSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()

  return useQuery({
    queryKey: notificationsQueryKeys.smsSendHistory.list(searchParamsKey),
    queryFn: () => getSmsSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
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
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.smsSendHistory.all() })
}

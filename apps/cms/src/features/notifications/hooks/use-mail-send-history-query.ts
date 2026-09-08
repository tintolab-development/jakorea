import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMailSendHistoryDetail,
  getMailSendHistoryList,
} from '@/features/notifications/api/mail-send-history-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

export function useMailSendHistoryQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()

  return useQuery({
    queryKey: notificationsQueryKeys.mailSendHistory.list(searchParamsKey),
    queryFn: () => getMailSendHistoryList(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
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
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.mailSendHistory.all() })
}

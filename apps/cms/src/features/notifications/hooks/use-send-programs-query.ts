import { useQuery } from '@tanstack/react-query'
import { getNotificationSendPrograms } from '@/features/notifications/api/send-programs-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

export function useNotificationSendProgramsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.sendPrograms.picker(),
    queryFn: getNotificationSendPrograms,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

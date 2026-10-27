import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'
import {
  listPublicApplicationNotificationsService,
  retryPublicApplicationNotificationService,
} from './service'

export const publicApplicationNotificationQueryKeys = {
  all: ['public-application-notifications'] as const,
  list: () => [...publicApplicationNotificationQueryKeys.all, 'list'] as const,
}

export function usePublicApplicationNotifications(enabled = true) {
  return useQuery({
    queryKey: publicApplicationNotificationQueryKeys.list(),
    queryFn: listPublicApplicationNotificationsService,
    enabled: enabled && shouldUseHomepageRemoteApi(),
    staleTime: 0,
    retry: false,
  })
}

export function useRetryPublicApplicationNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryPublicApplicationNotificationService,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: publicApplicationNotificationQueryKeys.all,
      })
    },
  })
}

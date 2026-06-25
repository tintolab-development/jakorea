import { useQuery } from '@tanstack/react-query'
import { getAlimtalkTemplateList } from '@/features/notifications/api/alimtalk-template-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { useNotificationsRemoteEnabled } from '@/features/notifications/hooks/use-notifications-remote-enabled'

export function useAlimtalkTemplateListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useNotificationsRemoteEnabled(enabled)

  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkTemplates.list(searchParamsKey),
    queryFn: () => getAlimtalkTemplateList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

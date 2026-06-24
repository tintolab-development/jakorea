import { useQuery } from '@tanstack/react-query'
import { getAdminNotifications } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useAdminNotifications(enabled = true, unreadOnly = false) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)
  const params = { page: 0, size: 20, unreadOnly }

  return useQuery({
    queryKey: dashboardQueryKeys.notifications('remote', params),
    queryFn: () =>
      getAdminNotifications({
        page: params.page,
        size: params.size,
        unreadOnly: params.unreadOnly,
      }),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

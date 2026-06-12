import { useQuery } from '@tanstack/react-query'
import { getDashboardNotificationCount } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardNotificationCount(enabled = true) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: dashboardQueryKeys.notificationCount('remote'),
    queryFn: () => getDashboardNotificationCount(),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

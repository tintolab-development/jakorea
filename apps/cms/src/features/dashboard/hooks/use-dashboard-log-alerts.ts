import { useQuery } from '@tanstack/react-query'
import { getDashboardLogAlerts } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardLogAlerts(enabled = true) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: dashboardQueryKeys.logAlerts('remote'),
    queryFn: () => getDashboardLogAlerts(),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}

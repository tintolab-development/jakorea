import { useQuery } from '@tanstack/react-query'
import { getDashboardShortcutBadges } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardShortcutBadges(enabled = true) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: dashboardQueryKeys.shortcutBadges('remote'),
    queryFn: () => getDashboardShortcutBadges(),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

import { useQuery } from '@tanstack/react-query'
import { getDashboardWidgetCatalog } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import {
  useDashboardQueryScope,
  useDashboardRemoteQueryEnabled,
} from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardWidgets(enabled = true) {
  const scope = useDashboardQueryScope()
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: dashboardQueryKeys.widgetCatalog(scope),
    queryFn: () => getDashboardWidgetCatalog(),
    enabled: remoteEnabled,
    staleTime: 60_000,
    refetchOnMount: 'always',
    retry: false,
  })
}

import { useQuery } from '@tanstack/react-query'
import { getDashboardProgramOptions } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardProgramOptions(widgetKey: string, enabled = true) {
  const scope = useDashboardQueryScope()

  return useQuery({
    queryKey: dashboardQueryKeys.programOptions(scope, widgetKey),
    queryFn: () => getDashboardProgramOptions(widgetKey),
    enabled: enabled && Boolean(widgetKey),
    staleTime: 60_000,
    retry: false,
  })
}

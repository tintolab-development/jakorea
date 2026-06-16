import { useQuery } from '@tanstack/react-query'
import { getDashboardHomeSummary } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardHome(enabled = true) {
  const scope = useDashboardQueryScope()

  return useQuery({
    queryKey: dashboardQueryKeys.home(scope),
    queryFn: () => getDashboardHomeSummary(),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

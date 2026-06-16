import { useQuery } from '@tanstack/react-query'
import { getDashboardShortcuts } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardShortcuts(enabled = true) {
  const scope = useDashboardQueryScope()

  return useQuery({
    queryKey: dashboardQueryKeys.shortcuts(scope),
    queryFn: () => getDashboardShortcuts(),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

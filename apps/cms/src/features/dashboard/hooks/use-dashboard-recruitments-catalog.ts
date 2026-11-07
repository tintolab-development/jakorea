import { useQuery } from '@tanstack/react-query'
import { fetchDashboardRecruitmentsCatalog } from '@/features/dashboard/api/admin-dashboard-service'
import { EMPTY_DASHBOARD_QUERY_PARAMS } from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useDashboardRecruitmentsCatalog(enabled = true) {
  const scope = useDashboardQueryScope()

  return useQuery({
    queryKey: dashboardQueryKeys.recruitments(scope, EMPTY_DASHBOARD_QUERY_PARAMS),
    queryFn: () => fetchDashboardRecruitmentsCatalog(),
    enabled: enabled && scope === 'remote',
    staleTime: 60_000,
    retry: false,
  })
}

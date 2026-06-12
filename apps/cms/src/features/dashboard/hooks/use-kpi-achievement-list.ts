import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKpiAchievementList } from '@/features/dashboard/api/admin-dashboard-service'
import { toDashboardQueryParams } from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useKpiAchievementList(programIds: string[]) {
  const scope = useDashboardQueryScope()
  const queryParams = useMemo(
    () => toDashboardQueryParams(programIds.length > 0 ? { programIds } : undefined),
    [programIds]
  )

  return useQuery({
    queryKey: dashboardQueryKeys.kpiProgress(scope, queryParams),
    queryFn: () => getKpiAchievementList(programIds.length > 0 ? { programIds } : undefined),
    staleTime: 60_000,
    retry: false,
  })
}

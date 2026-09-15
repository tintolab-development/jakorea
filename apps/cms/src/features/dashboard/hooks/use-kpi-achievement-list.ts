import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKpiAchievementList } from '@/features/dashboard/api/admin-dashboard-service'
import { toDashboardQueryParams } from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useKpiAchievementList(programIds: string[]) {
  const scope = useDashboardQueryScope()
  const programIdsKey = useMemo(
    () =>
      programIds.length > 0
        ? [...programIds].map(String).sort().join(',')
        : '',
    [programIds]
  )
  const queryParams = useMemo(
    () =>
      toDashboardQueryParams(
        programIdsKey ? { programIds: programIdsKey.split(',') } : undefined
      ),
    [programIdsKey]
  )

  return useQuery({
    queryKey: dashboardQueryKeys.kpiProgress(scope, queryParams),
    queryFn: () =>
      getKpiAchievementList(
        programIdsKey ? { programIds: programIdsKey.split(',') } : undefined
      ),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

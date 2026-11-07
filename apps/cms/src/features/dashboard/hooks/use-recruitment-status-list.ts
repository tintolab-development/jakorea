import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardRecruitmentsCatalog } from '@/features/dashboard/api/admin-dashboard-service'
import { mapRecruitmentListResponse } from '@/features/dashboard/api/adapters/dashboard-adapters'
import {
  fetchDashboardRecruitmentsRemote,
  normalizeDashboardProgramIds,
  toDashboardQueryParams,
} from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import {
  useDashboardQueryScope,
  useDashboardRemoteQueryEnabled,
} from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useRecruitmentStatusList(programIds: string[]) {
  const scope = useDashboardQueryScope()
  const remoteEnabled = useDashboardRemoteQueryEnabled()
  const normalizedIds = useMemo(
    () => normalizeDashboardProgramIds(programIds),
    [programIds]
  )
  const queryParams = useMemo(
    () => toDashboardQueryParams(normalizedIds ? { programIds: normalizedIds } : undefined),
    [normalizedIds]
  )
  const isUnfiltered = !normalizedIds

  return useQuery({
    queryKey: dashboardQueryKeys.recruitments(scope, queryParams),
    queryFn: () =>
      isUnfiltered
        ? fetchDashboardRecruitmentsCatalog()
        : fetchDashboardRecruitmentsRemote(queryParams),
    select: mapRecruitmentListResponse,
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProgramInquiryStatusList } from '@/features/dashboard/api/admin-dashboard-service'
import {
  normalizeDashboardProgramIds,
  toDashboardQueryParams,
} from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import {
  useDashboardQueryScope,
  useDashboardRemoteQueryEnabled,
} from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useProgramInquiryStatusList(programIds: string[]) {
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

  return useQuery({
    queryKey: dashboardQueryKeys.programInquiries(scope, queryParams),
    queryFn: () =>
      getProgramInquiryStatusList(normalizedIds ? { programIds: normalizedIds } : undefined),
    enabled: remoteEnabled,
    staleTime: 60_000,
    refetchOnMount: 'always',
    retry: false,
  })
}

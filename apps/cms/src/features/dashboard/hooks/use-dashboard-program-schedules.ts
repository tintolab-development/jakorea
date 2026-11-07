import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardScheduleEvents } from '@/features/dashboard/api/admin-dashboard-service'
import {
  normalizeDashboardProgramIds,
  toDashboardQueryParams,
} from '@/features/dashboard/api/dashboard-api-client'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export interface UseDashboardProgramSchedulesOptions {
  programIds?: string[]
  dateFrom?: string
  dateTo?: string
  programType?: string
  enabled?: boolean
}

export function useDashboardProgramSchedules(options: UseDashboardProgramSchedulesOptions) {
  const { programIds, dateFrom, dateTo, programType, enabled = true } = options
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)
  const normalizedIds = useMemo(
    () => normalizeDashboardProgramIds(programIds),
    [programIds]
  )

  const queryParams = useMemo(() => {
    const extra: Record<string, string> = {}
    if (dateFrom) extra.dateFrom = dateFrom
    if (dateTo) extra.dateTo = dateTo
    if (programType) extra.programType = programType
    return toDashboardQueryParams({
      programIds: normalizedIds,
      extra,
    })
  }, [normalizedIds, dateFrom, dateTo, programType])

  return useQuery({
    queryKey: dashboardQueryKeys.programSchedules('remote', queryParams),
    queryFn: () =>
      getDashboardScheduleEvents({
        programIds: normalizedIds,
        dateFrom,
        dateTo,
        programType,
      }),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}

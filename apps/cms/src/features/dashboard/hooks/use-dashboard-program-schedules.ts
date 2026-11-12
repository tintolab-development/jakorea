import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  buildDashboardScheduleEventsParams,
  getDashboardScheduleEvents,
} from '@/features/dashboard/api/admin-dashboard-service'
import { normalizeDashboardProgramIds } from '@/features/dashboard/api/dashboard-api-client'
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

  // QA-0382: 프로그램 목록 캘린더와 같은 기준 — 교육 회차에 운영 기간·모집 기간 일정을 함께 받는다
  const queryParams = useMemo(
    () =>
      buildDashboardScheduleEventsParams({
        programIds: normalizedIds,
        dateFrom,
        dateTo,
        programType,
        includeOperationalEvents: true,
      }),
    [normalizedIds, dateFrom, dateTo, programType]
  )

  return useQuery({
    queryKey: dashboardQueryKeys.programSchedules('remote', queryParams),
    queryFn: () =>
      getDashboardScheduleEvents({
        programIds: normalizedIds,
        dateFrom,
        dateTo,
        programType,
        includeOperationalEvents: true,
      }),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}

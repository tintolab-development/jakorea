import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildScheduleIdByIsoDateMap,
  fetchProgramSchedulesLoose,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { fetchUjatTypedDetailRemote } from '@/features/program/ujat/api/typed-detail-client'
import {
  buildUjatProgramScheduleDates,
  type UjatInstitutionScheduleAssignDateEntry,
} from './education-schedule'

export function useUjatProgramScheduleDates(programId?: string | null): {
  dates: UjatInstitutionScheduleAssignDateEntry[]
  loading: boolean
  scheduleIdByIsoDate: Map<string, number>
} {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const schedulesQuery = useQuery({
    queryKey: ujatQueryKeys.programSchedules(programId ?? ''),
    queryFn: () => fetchProgramSchedulesLoose(String(programId)),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
  const typedDetailQuery = useQuery({
    queryKey: ujatQueryKeys.typedDetail(programId ?? ''),
    queryFn: () => fetchUjatTypedDetailRemote(String(programId)),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const dates = useMemo(
    () => buildUjatProgramScheduleDates(schedulesQuery.data ?? [], typedDetailQuery.data),
    [schedulesQuery.data, typedDetailQuery.data]
  )

  const scheduleIdByIsoDate = useMemo(
    () => buildScheduleIdByIsoDateMap(schedulesQuery.data ?? []),
    [schedulesQuery.data]
  )

  return {
    dates,
    loading: remoteEnabled && (schedulesQuery.isLoading || typedDetailQuery.isLoading),
    scheduleIdByIsoDate,
  }
}

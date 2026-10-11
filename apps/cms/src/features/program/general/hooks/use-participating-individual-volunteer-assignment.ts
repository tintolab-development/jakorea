import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import {
  fetchGeneralParticipantEducationScope,
  fetchGeneralProgressAttendanceBundle,
} from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  buildIndividualVolunteerAssignmentRowsFromEducationScope,
  canBuildIndividualVolunteerAssignmentRows,
  resolveProgramVolunteerServiceRegionFallback,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment'
import type {
  ParticipatingIndividualVolunteerAssignedScheduleRow,
  ParticipatingIndividualVolunteerWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-types'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useParticipatingIndividualVolunteerAssignment(input: {
  program: Program
  volunteer: ParticipatingVolunteerRow
}) {
  const { program, volunteer } = input
  const queryClient = useQueryClient()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-individual-volunteer-education-scope',
    '참여 봉사자 상세 · 봉사 배정'
  )

  const scopeQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.educationScope(program.id, volunteer.id),
    queryFn: () => fetchGeneralParticipantEducationScope(program.id, volunteer.id),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const schedulesQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.schedules(String(program.id)),
    queryFn: () => fetchGeneralProgressAttendanceBundle(String(program.id)),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const isLoading =
    remoteEnabled &&
    ((schedulesQuery.isPending && schedulesQuery.data === undefined) ||
      (scopeQuery.isPending && scopeQuery.data === undefined))

  const rows = useMemo((): {
    assigned: ParticipatingIndividualVolunteerAssignedScheduleRow[]
    waiting: ParticipatingIndividualVolunteerWaitingScheduleRow[]
  } => {
    if (
      !canBuildIndividualVolunteerAssignmentRows({
        remoteEnabled,
        schedulesData: schedulesQuery.data,
        scopeData: scopeQuery.data,
      })
    ) {
      return { assigned: [], waiting: [] }
    }
    const assignedScheduleIds =
      scopeQuery.data?.configured === false ? [] : (scopeQuery.data?.scheduleIds ?? [])
    return buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds,
      schedules: schedulesQuery.data!.schedules,
      scopeScheduleEnrich: scopeQuery.data?.schedules,
      participantSessions: volunteer.sessions,
      serviceRegionFallback:
        volunteer.homeRegion?.trim() || resolveProgramVolunteerServiceRegionFallback(program),
    })
  }, [
    program,
    remoteEnabled,
    schedulesQuery.data,
    scopeQuery.data,
    volunteer.homeRegion,
    volunteer.sessions,
  ])

  const invalidateScope = async () => {
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.educationScope(program.id, volunteer.id),
    })
  }

  return {
    remoteEnabled,
    isLoading,
    assignedSchedules: rows.assigned,
    waitingSchedules: rows.waiting,
    scopeQuery,
    schedulesQuery,
    invalidateScope,
  }
}

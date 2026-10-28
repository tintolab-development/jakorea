import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import { fetchInstructorAssignmentAvailabilityRemote } from '@/features/program/general/api/instructor-assignments-api-client'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsCompanySchoolProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  buildEmptyParticipatingInstructorAssignmentRows,
  buildParticipatingInstructorAssignedSchoolRowsFromBoard,
  buildParticipatingInstructorAssignedScheduleRowsFromBoard,
  buildParticipatingInstructorWaitingSchoolRowsFromBoard,
  buildParticipatingInstructorWaitingScheduleRowsFromBoard,
} from '@/features/program/general/lib/build-participating-instructor-assignment-rows'
import {
  buildWaitingScheduleRowsFromAvailability,
  buildWaitingSchoolRowsFromAvailability,
  normalizeAvailabilityItems,
} from '@/features/program/general/lib/instructor-assignment-availability'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type {
  InstructorAssignedSchoolRow,
  InstructorWaitingSchoolRow,
} from '@/features/program/general/lib/instructor-institution-assignment'
import type {
  ParticipatingIndividualInstructorAssignedScheduleRow,
  ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useParticipatingInstructorInstitutionAssignment(input: {
  programId: string
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  isCompanySchool: boolean
  enabled?: boolean
  /** program participantRecruitmentInfo.maxAssignableInstructors (참여 기관 상세 배정 인원 분모와 동일 출처) */
  maxAssignableInstructors?: number | null
}): {
  remoteEnabled: boolean
  isLoading: boolean
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
  assignedSchedules: ParticipatingIndividualInstructorAssignedScheduleRow[]
  waitingSchedules: ParticipatingIndividualInstructorWaitingScheduleRow[]
  assignments: InstructorAssignmentListItemEnriched[]
  boardLoaded: boolean
  isTempMockDataSource: boolean
  invalidate: () => Promise<void>
} {
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  const useCompanySchoolBoard = isCompanySchoolSurface || input.isCompanySchool
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(input.programId)
  const instructorMemberId = input.instructor.memberId?.trim() ?? ''
  const instructorMemberIdNumber = Number(instructorMemberId)
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && instructorMemberId
  )
  const availabilityEnabled =
    queryEnabled &&
    !useCompanySchoolBoard &&
    Number.isFinite(instructorMemberIdNumber) &&
    instructorMemberIdNumber > 0
  const assignmentQueryKey = useCompanySchoolBoard
    ? companySchoolQueryKeys.instructorAssignmentConflicts(input.programId)
    : generalProgramProgressQueryKeys.instructorAssignments(input.programId)
  const availabilityQueryKey = generalProgramProgressQueryKeys.instructorAssignmentAvailability(
    input.programId,
    instructorMemberId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !instructorMemberId)),
    'general-participating-instructor-assignment',
    '참여 강사 · 교육 배정 현황'
  )

  const boardQuery = useQuery({
    queryKey: assignmentQueryKey,
    queryFn: () =>
      useCompanySchoolBoard
        ? fetchCompanySchoolAssignmentBoard(input.programId)
        : fetchGeneralInstructorAssignmentBoard(input.programId),
    enabled: queryEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const availabilityQuery = useQuery({
    queryKey: availabilityQueryKey,
    queryFn: () =>
      fetchInstructorAssignmentAvailabilityRemote(input.programId, instructorMemberIdNumber),
    enabled: availabilityEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const queryClient = useQueryClient()

  const rows = useMemo(() => {
    if (!remoteEnabled || !instructorMemberId) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }
    const board = boardQuery.data
    if (!board) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }

    const assignedSchools = buildParticipatingInstructorAssignedSchoolRowsFromBoard({
      assignments: board.assignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById: board.scheduleLabelById,
    })
    const assignedSchedules = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      assignments: board.assignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById: board.scheduleLabelById,
    })

    if (useCompanySchoolBoard) {
      const assignedSchoolIds = new Set(assignedSchools.map(row => row.id))
      return {
        assignedSchools,
        waitingSchools: buildParticipatingInstructorWaitingSchoolRowsFromBoard({
          instructor: input.instructor,
          schoolRows: input.schoolRows,
          instructorList: input.instructorList,
          assignedSchoolIds,
          isCompanySchool: true,
          assignments: board.assignments,
          instructorMemberId,
          maxAssignableInstructors: input.maxAssignableInstructors,
        }),
        assignedSchedules,
        waitingSchedules: buildParticipatingInstructorWaitingScheduleRowsFromBoard({
          instructor: input.instructor,
          schedules: board.schedules,
          scheduleLabelById: board.scheduleLabelById,
          assignments: board.assignments,
          instructorMemberId,
          maxAssignableInstructors: input.maxAssignableInstructors,
        }),
      }
    }

    const availabilityItems = availabilityQuery.isError
      ? []
      : normalizeAvailabilityItems(availabilityQuery.data)
    const lectureLocationByScheduleId = new Map<string, string>()
    for (const schedule of board.schedules) {
      if (schedule.id == null) continue
      const location = schedule.locationName?.trim() || schedule.address?.trim() || ''
      if (location) lectureLocationByScheduleId.set(String(schedule.id), location)
    }

    return {
      assignedSchools,
      waitingSchools: buildWaitingSchoolRowsFromAvailability({
        items: availabilityItems,
        instructor: input.instructor,
        schoolRows: input.schoolRows,
        scheduleLabelById: board.scheduleLabelById,
        instructorMemberId,
      }),
      assignedSchedules,
      waitingSchedules: buildWaitingScheduleRowsFromAvailability({
        items: availabilityItems,
        instructor: input.instructor,
        scheduleLabelById: board.scheduleLabelById,
        lectureLocationByScheduleId,
        instructorMemberId,
      }),
    }
  }, [
    availabilityQuery.data,
    availabilityQuery.isError,
    boardQuery.data,
    input.instructor,
    input.instructorList,
    input.maxAssignableInstructors,
    input.schoolRows,
    instructorMemberId,
    remoteEnabled,
    useCompanySchoolBoard,
  ])

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: assignmentQueryKey }),
      availabilityEnabled
        ? queryClient.invalidateQueries({ queryKey: availabilityQueryKey })
        : Promise.resolve(),
    ])
  }

  const availabilityLoading =
    availabilityEnabled && availabilityQuery.isFetching && availabilityQuery.data === undefined
  const boardLoading = queryEnabled && boardQuery.isFetching && boardQuery.data === undefined

  return {
    remoteEnabled: remoteEnabled && Boolean(instructorMemberId),
    isTempMockDataSource: false,
    isLoading: boardLoading || availabilityLoading,
    assignedSchools: rows.assignedSchools,
    waitingSchools: rows.waitingSchools,
    assignedSchedules: rows.assignedSchedules,
    waitingSchedules: rows.waitingSchedules,
    assignments: boardQuery.data?.assignments ?? [],
    boardLoaded: boardQuery.data != null,
    invalidate,
  }
}

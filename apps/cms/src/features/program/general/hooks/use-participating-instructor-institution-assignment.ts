import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import { fetchInstructorAssignmentCalendarRemote } from '@/features/program/general/api/instructor-assignments-api-client'
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

function selectAssignmentsFromCalendar(
  assignments: InstructorAssignmentListItemEnriched[],
  calendarItems: Array<{ assignmentId?: number | null }>,
  instructorMemberId: string
): InstructorAssignmentListItemEnriched[] {
  const activeAssignmentIds = new Set(
    calendarItems
      .map(item => item.assignmentId)
      .filter((assignmentId): assignmentId is number => assignmentId != null)
      .map(String)
  )

  return assignments.filter(assignment => {
    if (assignment.instructorMemberId == null) return false
    if (String(assignment.instructorMemberId) !== instructorMemberId) return false
    if (assignment.assignmentId == null) return false
    return activeAssignmentIds.has(String(assignment.assignmentId))
  })
}

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
  error?: unknown
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
  const calendarEnabled =
    queryEnabled &&
    !useCompanySchoolBoard &&
    Number.isFinite(instructorMemberIdNumber) &&
    instructorMemberIdNumber > 0
  const assignmentQueryKey = useCompanySchoolBoard
    ? companySchoolQueryKeys.instructorAssignmentConflicts(input.programId)
    : generalProgramProgressQueryKeys.instructorAssignments(input.programId)
  const calendarQueryKey = generalProgramProgressQueryKeys.instructorAssignmentCalendar(
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

  const calendarQuery = useQuery({
    queryKey: calendarQueryKey,
    queryFn: () =>
      fetchInstructorAssignmentCalendarRemote(input.programId, {
        instructorMemberId: instructorMemberIdNumber,
      }),
    enabled: calendarEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const queryClient = useQueryClient()
  const queryError = boardQuery.error ?? (calendarEnabled ? calendarQuery.error : undefined)

  const rows = useMemo(() => {
    if (!remoteEnabled || !instructorMemberId) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }
    const board = boardQuery.data
    if (
      !board ||
      queryError ||
      (!useCompanySchoolBoard && calendarQuery.data == null)
    ) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }

    const assignedAssignments = useCompanySchoolBoard
      ? board.assignments
      : selectAssignmentsFromCalendar(
          board.assignments,
          calendarQuery.data?.items ?? [],
          instructorMemberId
        )
    const assignedSchools = buildParticipatingInstructorAssignedSchoolRowsFromBoard({
      assignments: assignedAssignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById: board.scheduleLabelById,
    })
    const assignedSchedules = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      assignments: assignedAssignments,
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

    return {
      assignedSchools,
      waitingSchools: buildParticipatingInstructorWaitingSchoolRowsFromBoard({
        assignments: board.assignments,
        instructor: input.instructor,
        schoolRows: input.schoolRows,
        instructorList: input.instructorList,
        assignedSchoolIds: new Set(assignedSchools.map(row => row.id)),
        isCompanySchool: false,
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
  }, [
    calendarQuery.data,
    boardQuery.data,
    queryError,
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
      calendarEnabled
        ? queryClient.invalidateQueries({ queryKey: calendarQueryKey })
        : Promise.resolve(),
    ])
  }

  const calendarLoading =
    calendarEnabled && calendarQuery.isFetching && calendarQuery.data === undefined
  const boardLoading = queryEnabled && boardQuery.isFetching && boardQuery.data === undefined

  return {
    remoteEnabled: remoteEnabled && Boolean(instructorMemberId),
    isTempMockDataSource: false,
    isLoading: boardLoading || calendarLoading,
    assignedSchools: rows.assignedSchools,
    waitingSchools: rows.waitingSchools,
    assignedSchedules: rows.assignedSchedules,
    waitingSchedules: rows.waitingSchedules,
    assignments: queryError ? [] : boardQuery.data?.assignments ?? [],
    boardLoaded: boardQuery.data != null && !queryError,
    error: queryError,
    invalidate,
  }
}

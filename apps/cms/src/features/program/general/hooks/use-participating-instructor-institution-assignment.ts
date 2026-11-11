import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import { omitCompanySchoolScheduleRoundLabels } from '@/features/program/1c-1s/lib/build-company-school-assignment-rows'
import { fetchGeneralParticipantEducationScope } from '@/features/program/general/api/admin-program-progress-service'
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
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
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
import {
  collectInstructorApplicationOrganizationDistances,
  mergeWaitingOrganizationDistances,
} from '@/features/program/general/lib/assignment-waiting-distance'

/**
 * 배정 현황 SSOT = GET /api/admin/program-execution/instructor-assignments (board.assignments).
 * instructor-assignment-calendar 와 교차하지 않는다 — calendar 빈 items로 배정 list를 숨기면
 * Platform lecture-report-assignments 와 CMS 노출이 어긋난다.
 * URL instructorId 는 participantId 이며, 필터 키는 instructor.memberId(member.id)다.
 */
export function selectAssignmentsForInstructor(
  assignments: InstructorAssignmentListItemEnriched[],
  instructorMemberId: string
): InstructorAssignmentListItemEnriched[] {
  return assignments.filter(assignment => {
    if (assignment.instructorMemberId == null) return false
    if (String(assignment.instructorMemberId) !== instructorMemberId) return false
    const status = (assignment.assignmentStatus ?? '').toUpperCase()
    return status !== 'CANCELLED' && status !== 'CANCELED'
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
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && instructorMemberId
  )
  const assignmentQueryKey = useCompanySchoolBoard
    ? companySchoolQueryKeys.instructorAssignmentConflicts(input.programId)
    : generalProgramProgressQueryKeys.instructorAssignments(input.programId)

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

  /**
   * 배정 대기 「자택과의 거리」 — education-scope 서버값만 쓴다(개인형 schedules[] · 기관형 organizations[]).
   * 실패해도 배정 표는 그대로 두고 거리 칸만 '-'.
   */
  const participantId = input.instructor.id?.trim() ?? ''
  const distanceScopeQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.educationScope(input.programId, participantId),
    queryFn: () => fetchGeneralParticipantEducationScope(input.programId, participantId),
    enabled: queryEnabled && Boolean(participantId),
    staleTime: 15_000,
    retry: false,
  })
  const scheduleDistances = distanceScopeQuery.data?.schedules
  const scopeOrganizationDistances = distanceScopeQuery.data?.organizations
  /**
   * 기관형 거리 — education-scope `organizations[]`를 먼저 쓰고, 비어 있는 기관은
   * 같은 강사의 강사 신청 응답(organizationDistances·preferredOrganizations)으로 채운다.
   */
  const approvedInstructorApplications = useCompanySchoolBoard
    ? undefined
    : (boardQuery.data as { approvedInstructorApplications?: InstructorApplicationListItemResponse[] } | undefined)
        ?.approvedInstructorApplications
  const organizationDistances = useMemo(() => {
    // 1사1교는 기존처럼 education-scope 값만 쓴다
    if (!approvedInstructorApplications) return scopeOrganizationDistances
    const ownApplication = approvedInstructorApplications?.find(
      app => app.instructorMemberId != null && String(app.instructorMemberId) === instructorMemberId
    )
    return mergeWaitingOrganizationDistances(
      scopeOrganizationDistances,
      collectInstructorApplicationOrganizationDistances(ownApplication)
    )
  }, [approvedInstructorApplications, instructorMemberId, scopeOrganizationDistances])

  const queryClient = useQueryClient()
  const queryError = boardQuery.error

  const rows = useMemo(() => {
    if (!remoteEnabled || !instructorMemberId) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }
    const board = boardQuery.data
    if (!board || queryError) {
      return {
        ...buildEmptyParticipatingInstructorAssignmentRows(),
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }

    // 1사1교는 회차가 없다 — 배정 일정 라벨에서 sessionNo 「N회차」를 뺀다(날짜·시간만)
    const scheduleLabelById = useCompanySchoolBoard
      ? omitCompanySchoolScheduleRoundLabels(board.scheduleLabelById)
      : board.scheduleLabelById
    const assignedAssignments = selectAssignmentsForInstructor(
      board.assignments,
      instructorMemberId
    )
    const assignedSchools = buildParticipatingInstructorAssignedSchoolRowsFromBoard({
      assignments: assignedAssignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById,
    })
    const assignedSchedules = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      assignments: assignedAssignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById,
      schedules: board.schedules,
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
          organizationDistances,
        }),
        assignedSchedules,
        waitingSchedules: buildParticipatingInstructorWaitingScheduleRowsFromBoard({
          instructor: input.instructor,
          schedules: board.schedules,
          scheduleLabelById,
          assignments: board.assignments,
          instructorMemberId,
          maxAssignableInstructors: input.maxAssignableInstructors,
          scheduleDistances,
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
        organizationDistances,
      }),
      assignedSchedules,
      waitingSchedules: buildParticipatingInstructorWaitingScheduleRowsFromBoard({
        instructor: input.instructor,
        schedules: board.schedules,
        scheduleLabelById,
        assignments: board.assignments,
        instructorMemberId,
        maxAssignableInstructors: input.maxAssignableInstructors,
        scheduleDistances,
      }),
    }
  }, [
    boardQuery.data,
    queryError,
    input.instructor,
    input.instructorList,
    input.maxAssignableInstructors,
    input.schoolRows,
    instructorMemberId,
    organizationDistances,
    remoteEnabled,
    scheduleDistances,
    useCompanySchoolBoard,
  ])

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: assignmentQueryKey }),
      participantId
        ? queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.educationScope(input.programId, participantId),
          })
        : Promise.resolve(),
    ])
  }

  const boardLoading = queryEnabled && boardQuery.isFetching && boardQuery.data === undefined

  return {
    remoteEnabled: remoteEnabled && Boolean(instructorMemberId),
    isTempMockDataSource: false,
    isLoading: boardLoading,
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

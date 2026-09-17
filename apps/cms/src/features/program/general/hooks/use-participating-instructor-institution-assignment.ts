import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  buildInitialAssignedSchoolRows,
  buildWaitingSchoolRows,
} from '@/features/program/general/lib/instructor-institution-assignment'
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

export function useParticipatingInstructorInstitutionAssignment(input: {
  programId: string
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  isCompanySchool: boolean
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
  assignedSchedules: ParticipatingIndividualInstructorAssignedScheduleRow[]
  waitingSchedules: ParticipatingIndividualInstructorWaitingScheduleRow[]
  isTempMockDataSource: boolean
  invalidate: () => Promise<void>
} {
  const remoteEnabled = shouldUseGeneralProgramProgressRemoteApi()
  const isTempMockProgram = isGeneralProgramTempMockProgramId(input.programId)
  const instructorMemberId = input.instructor.memberId?.trim() ?? ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && instructorMemberId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(
      input.enabled !== false &&
        !isTempMockProgram &&
        (!remoteEnabled || !instructorMemberId)
    ),
    'general-participating-instructor-assignment',
    '참여 강사 · 교육 배정 현황'
  )

  const boardQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.instructorAssignments(input.programId),
    queryFn: () => fetchGeneralInstructorAssignmentBoard(input.programId),
    enabled: queryEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const queryClient = useQueryClient()

  const rows = useMemo(() => {
    if (isTempMockProgram && input.enabled !== false) {
      const assignedSchools = buildInitialAssignedSchoolRows(
        input.instructor,
        input.schoolRows,
        input.instructorList
      )
      const assignedSchoolIds = new Set(assignedSchools.map(row => row.id))
      const waitingSchools = buildWaitingSchoolRows(
        input.instructor,
        input.schoolRows,
        input.instructorList,
        assignedSchoolIds
      )
      return {
        assignedSchools,
        waitingSchools,
        assignedSchedules: [] as ParticipatingIndividualInstructorAssignedScheduleRow[],
        waitingSchedules: [] as ParticipatingIndividualInstructorWaitingScheduleRow[],
      }
    }

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
    const assignedSchoolIds = new Set(assignedSchools.map(row => row.id))
    const waitingSchools = buildParticipatingInstructorWaitingSchoolRowsFromBoard({
      instructor: input.instructor,
      schoolRows: input.schoolRows,
      instructorList: input.instructorList,
      assignedSchoolIds,
      isCompanySchool: input.isCompanySchool,
      assignments: board.assignments,
      instructorMemberId,
    })
    const assignedSchedules = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      assignments: board.assignments,
      instructorMemberId,
      schoolRows: input.schoolRows,
      scheduleLabelById: board.scheduleLabelById,
    })
    const waitingSchedules = buildParticipatingInstructorWaitingScheduleRowsFromBoard({
      instructor: input.instructor,
      schoolRows: input.schoolRows,
      instructorList: input.instructorList,
      assignedSchoolIds,
      assignments: board.assignments,
      instructorMemberId,
    })
    return {
      assignedSchools,
      waitingSchools,
      assignedSchedules,
      waitingSchedules,
    }
  }, [
    boardQuery.data,
    input.enabled,
    input.instructor,
    input.instructorList,
    input.isCompanySchool,
    input.schoolRows,
    instructorMemberId,
    isTempMockProgram,
    remoteEnabled,
  ])

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.instructorAssignments(input.programId),
    })
  }

  return {
    remoteEnabled: remoteEnabled && Boolean(instructorMemberId),
    isTempMockDataSource: isTempMockProgram && input.enabled !== false,
    isLoading:
      !isTempMockProgram && queryEnabled && boardQuery.isFetching && boardQuery.data === undefined,
    assignedSchools: rows.assignedSchools,
    waitingSchools: rows.waitingSchools,
    assignedSchedules: rows.assignedSchedules,
    waitingSchedules: rows.waitingSchedules,
    invalidate,
  }
}

import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type { SchoolDetailAttendanceSessionGroup } from '../model/school-detail-types'
import {
  buildSchoolDetailAttendanceEducationScheduleOptions as buildEducationScheduleOptionsFromApi,
  buildSchoolDetailAttendanceSessionGroups,
} from '../api/school-detail-attendance-api'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import {
  mapOrganizationScheduleAssignmentSlotsToAssignedSessions,
  resolveParticipatingProgressAssignedSessions,
} from './organization-education-schedule-sources'

export const SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES = {
  noAssignedSchedules: '배정된 교육 일정이 없습니다.',
  noStudents: '등록된 학생이 없습니다.',
  noFilterMatch: '조회 결과가 없습니다.',
  assignmentScopeUnavailable: '배정된 교육 일정을 확인할 수 없습니다.',
} as const

export function dedupeParticipatingSessionsByScheduleId(
  sessions: readonly ParticipatingSchoolSession[]
): ParticipatingSchoolSession[] {
  const seen = new Set<number>()
  const result: ParticipatingSchoolSession[] = []
  for (const session of sessions) {
    const scheduleId = session.resolvedScheduleId
    if (typeof scheduleId === 'number' && Number.isFinite(scheduleId) && scheduleId > 0) {
      if (seen.has(scheduleId)) continue
      seen.add(scheduleId)
    }
    result.push(session)
  }
  return result
}

/**
 * 출석 회차 SSOT.
 * 일반 기관은 OSA 배정 일정만 사용한다. `row.sessions`(프로그램 전체 일정일 수 있음)로 대체하지 않는다.
 * 그 외(교육받은 교사 등)는 참여자 API의 확정 배정 일정을 사용한다.
 */
export function resolveSchoolDetailAttendanceSessions(input: {
  row: ParticipatingSchoolRow
  isGeneralOrganization: boolean
  assignmentSlots?: readonly SlotResponse[] | null
  programSchedules?: readonly ProgramScheduleResponse[] | null
  assignmentScopeReady: boolean
}): ParticipatingSchoolSession[] {
  if (input.isGeneralOrganization) {
    if (!input.assignmentScopeReady || input.assignmentSlots == null) return []
    const programId = String(input.row.programId ?? '').trim()
    const organizationApplicationId = String(input.row.organizationApplicationId ?? '').trim()
    if (!programId || !organizationApplicationId) return []
    return dedupeParticipatingSessionsByScheduleId(
      mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
        input.assignmentSlots,
        input.programSchedules ?? [],
        { programId, organizationApplicationId }
      )
    )
  }
  return dedupeParticipatingSessionsByScheduleId(
    resolveParticipatingProgressAssignedSessions(input.row.sessions)
  )
}

/** @deprecated {@link resolveSchoolDetailAttendanceSessions} */
export function resolveAttendanceSessions(
  row: ParticipatingSchoolRow
): ParticipatingSchoolSession[] {
  return resolveParticipatingProgressAssignedSessions(row.sessions)
}

export function getSchoolDetailAttendanceEducationScheduleOptions(
  row: ParticipatingSchoolRow,
  program: Program,
  sessions?: ParticipatingSchoolSession[]
): Array<{ label: string; value: string }> {
  return buildEducationScheduleOptionsFromApi({
    schoolId: row.id,
    program,
    sessions: sessions ?? resolveAttendanceSessions(row),
  })
}

export function mergeSchoolDetailAttendanceRemoteData(input: {
  row: ParticipatingSchoolRow
  program: Program
  sessions: ParticipatingSchoolSession[]
  rosterStudents: SchoolDetailStudentRow[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
  giveUpParticipants?: Array<{
    participantId?: number
    giveUpAt?: string | null
    participantStatus?: string | null
  }> | null
}): SchoolDetailAttendanceSessionGroup[] {
  return buildSchoolDetailAttendanceSessionGroups({
    schoolId: input.row.id,
    program: input.program,
    sessions: input.sessions,
    rosterStudents: input.rosterStudents,
    attendancesByScheduleId: input.attendancesByScheduleId,
    giveUpParticipants: input.giveUpParticipants,
  })
}

/** remote 미연동 시 빈 출석 세션 (mock 제거) */
export function buildTemporarySchoolDetailAttendanceSessionGroups(
  _row: ParticipatingSchoolRow,
  _program: Program
): SchoolDetailAttendanceSessionGroup[] {
  return []
}

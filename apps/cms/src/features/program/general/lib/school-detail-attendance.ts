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
import {
  buildAttendanceSessionHeaderParts,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from '@/features/program/general/lib/school-detail-attendance-display'
import {
  getSchoolDetailStudents,
  resolveTemporaryStudentSessionAttendanceStatus,
} from '@/features/program/general/lib/school-detail'
import { isTempMockOrgSchoolRowId } from '@/features/program/general/lib/temp-mock-org-program'

export function resolveAttendanceSessions(
  row: ParticipatingSchoolRow
): ParticipatingSchoolSession[] {
  return row.sessions ?? []
}

export function getSchoolDetailAttendanceEducationScheduleOptions(
  row: ParticipatingSchoolRow,
  program: Program
): Array<{ label: string; value: string }> {
  return buildEducationScheduleOptionsFromApi({
    schoolId: row.id,
    program,
    sessions: resolveAttendanceSessions(row),
  })
}

export function mergeSchoolDetailAttendanceRemoteData(input: {
  row: ParticipatingSchoolRow
  program: Program
  rosterStudents: SchoolDetailStudentRow[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
}): SchoolDetailAttendanceSessionGroup[] {
  return buildSchoolDetailAttendanceSessionGroups({
    schoolId: input.row.id,
    program: input.program,
    sessions: resolveAttendanceSessions(input.row),
    rosterStudents: input.rosterStudents,
    attendancesByScheduleId: input.attendancesByScheduleId,
  })
}

/** FE mock 참여 기관 — 학생 명단 시드 × 회차별 출석 상태 */
export function buildTemporarySchoolDetailAttendanceSessionGroups(
  row: ParticipatingSchoolRow,
  program: Program
): SchoolDetailAttendanceSessionGroup[] {
  if (!isTempMockOrgSchoolRowId(row.id)) return []
  const rosterStudents = getSchoolDetailStudents(row.id, row.studentCount)
  const sessions = resolveAttendanceSessions(row).filter(session => session.status !== 'not_planned')
  const total = rosterStudents.length

  return sessions.map(session => {
    const scheduleId =
      typeof session.resolvedScheduleId === 'number' &&
      Number.isFinite(session.resolvedScheduleId) &&
      session.resolvedScheduleId > 0
        ? session.resolvedScheduleId
        : null
    const id =
      scheduleId != null ? String(scheduleId) : `${row.id}-round-${session.round}`
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
    const header = buildAttendanceSessionHeaderParts(session, sessionLeadLabel)
    return {
      id,
      round: session.round,
      filterValue: id,
      scheduleId,
      sessionLeadLabel: header.sessionLeadLabel,
      headerTitle: header.title,
      headerScheduleSummary: header.scheduleSummary,
      headerPeriodRangeLabel: header.periodRangeLabel,
      headerPrefix: header.headerPrefix,
      students: rosterStudents.map((student, index) => ({
        id: student.id,
        no: total - index,
        name: student.name,
        gender: student.gender,
        birthDate: student.birthDate,
        gradeClass: student.gradeClass,
        contact: student.contact,
        email: student.email,
        participantId: student.participantId ?? null,
        status: resolveTemporaryStudentSessionAttendanceStatus(student.id, session.round),
      })),
    }
  })
}

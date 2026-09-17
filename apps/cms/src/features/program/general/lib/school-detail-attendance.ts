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

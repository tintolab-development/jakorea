import type { ParticipatingSchoolRow, ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type {
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolSessionAttendanceStatusKey,
} from '../model/school-detail-types'
import { getSchoolDetailStudents } from './school-detail-mock'
import {
  buildAttendanceSessionFilterLabel,
  buildAttendanceSessionHeaderParts,
  cloneAttendanceStudentRows,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from './school-detail-attendance-display'
import { isGeneralInstitutionCaseProgramId } from './general-institution-case-roster'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

/** 출석 관리 데모 — 스크린샷 시안(2회차·2교시 구간) */
const ATTENDANCE_DEMO_SESSIONS: ParticipatingSchoolSession[] = [
  {
    round: 1,
    date: '2026.01.09',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '1교시',
    timeRange: '9:20~11:20',
    status: 'pending',
  },
  {
    round: 2,
    date: '2026.02.13',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '3교시',
    timeRange: '11:20~13:20',
    status: 'pending',
  },
]

/** schoolId → sessionId → studentId → status */
const attendanceStatusStore: Record<
  string,
  Record<string, Record<string, SchoolSessionAttendanceStatusKey>>
> = {}

function initialAttendanceStatus(
  studentId: string,
  sessionId: string
): SchoolSessionAttendanceStatusKey {
  const h = hash(`${studentId}:${sessionId}`) % 12
  if (h === 0) return 'absent'
  if (h === 1 || h === 2) return 'late'
  return 'present'
}

function resolveAttendanceSessions(row: ParticipatingSchoolRow): ParticipatingSchoolSession[] {
  const fromRow = row.sessions ?? []
  if (fromRow.length >= 2) return fromRow
  if (fromRow.length === 1) {
    return [fromRow[0]!, ATTENDANCE_DEMO_SESSIONS[1]!]
  }
  return ATTENDANCE_DEMO_SESSIONS
}

function buildSessionStudents(
  row: ParticipatingSchoolRow,
  sessionId: string,
  studentCount: number
): SchoolDetailAttendanceStudentRow[] {
  const schoolId = row.id
  const baseStudents = getSchoolDetailStudents(schoolId, studentCount)
  const students = isGeneralInstitutionCaseProgramId(row.programId)
    ? baseStudents.slice(0, 3)
    : baseStudents
  const total = students.length
  return students.map((student, index) => {
    const saved = attendanceStatusStore[schoolId]?.[sessionId]?.[student.id]
    return {
      id: student.id,
      no: total - index,
      name: student.name,
      gender: student.gender,
      birthDate: student.birthDate,
      gradeClass: student.gradeClass,
      contact: student.contact,
      email: student.email,
      status:
        saved ??
        (isGeneralInstitutionCaseProgramId(row.programId)
          ? (['present', 'absent', 'late'] as const)[index]
          : initialAttendanceStatus(student.id, sessionId)),
    }
  })
}

function toSessionGroup(
  row: ParticipatingSchoolRow,
  session: ParticipatingSchoolSession,
  program: Program
): SchoolDetailAttendanceSessionGroup {
  const schoolId = row.id
  const id = `${schoolId}-round-${session.round}`
  const students = buildSessionStudents(row, id, row.studentCount)
  const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
  const header = buildAttendanceSessionHeaderParts(session, sessionLeadLabel)
  return {
    id,
    round: session.round,
    filterValue: id,
    sessionLeadLabel: header.sessionLeadLabel,
    headerTitle: header.title,
    headerScheduleSummary: header.scheduleSummary,
    headerPeriodRangeLabel: header.periodRangeLabel,
    headerPrefix: header.headerPrefix,
    students,
  }
}

export function getSchoolDetailAttendanceSessions(
  row: ParticipatingSchoolRow,
  program: Program
): SchoolDetailAttendanceSessionGroup[] {
  return resolveAttendanceSessions(row).map(session =>
    toSessionGroup(row, session, program)
  )
}

export function getSchoolDetailAttendanceEducationScheduleOptions(
  row: ParticipatingSchoolRow,
  program: Program
): Array<{ label: string; value: string }> {
  return resolveAttendanceSessions(row).map(session => {
    const id = `${row.id}-round-${session.round}`
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
    return {
      label: buildAttendanceSessionFilterLabel(session, sessionLeadLabel),
      value: id,
    }
  })
}

export function patchSchoolDetailAttendanceSession(
  schoolId: string,
  sessionId: string,
  students: SchoolDetailAttendanceStudentRow[]
): void {
  if (!attendanceStatusStore[schoolId]) {
    attendanceStatusStore[schoolId] = {}
  }
  if (!attendanceStatusStore[schoolId][sessionId]) {
    attendanceStatusStore[schoolId][sessionId] = {}
  }
  for (const student of students) {
    attendanceStatusStore[schoolId][sessionId]![student.id] = student.status
  }
}

export function getSchoolDetailAttendanceSessionStudents(
  row: ParticipatingSchoolRow,
  sessionId: string,
  program: Program
): SchoolDetailAttendanceStudentRow[] {
  const session = getSchoolDetailAttendanceSessions(row, program).find(item => item.id === sessionId)
  if (!session) return []
  return cloneAttendanceStudentRows(session.students)
}

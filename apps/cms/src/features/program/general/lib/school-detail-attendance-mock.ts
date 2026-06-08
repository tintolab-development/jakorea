import type { ParticipatingSchoolRow, ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type {
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolSessionAttendanceStatusKey,
} from '../model/school-detail-types'
import { getSchoolDetailStudents } from './school-detail-mock'
import {
  buildAttendanceSessionFilterLabel,
  buildAttendanceSessionHeaderPrefix,
  cloneAttendanceStudentRows,
} from './school-detail-attendance-display'

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
  schoolId: string,
  sessionId: string,
  studentCount: number
): SchoolDetailAttendanceStudentRow[] {
  const baseStudents = getSchoolDetailStudents(schoolId, studentCount)
  const total = baseStudents.length
  return baseStudents.map((student, index) => {
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
      status: saved ?? initialAttendanceStatus(student.id, sessionId),
    }
  })
}

function toSessionGroup(
  schoolId: string,
  session: ParticipatingSchoolSession,
  studentCount: number
): SchoolDetailAttendanceSessionGroup {
  const id = `${schoolId}-round-${session.round}`
  const students = buildSessionStudents(schoolId, id, studentCount)
  return {
    id,
    round: session.round,
    filterValue: id,
    headerPrefix: buildAttendanceSessionHeaderPrefix(session),
    students,
  }
}

export function getSchoolDetailAttendanceSessions(
  row: ParticipatingSchoolRow
): SchoolDetailAttendanceSessionGroup[] {
  return resolveAttendanceSessions(row).map(session =>
    toSessionGroup(row.id, session, row.studentCount)
  )
}

export function getSchoolDetailAttendanceEducationScheduleOptions(
  row: ParticipatingSchoolRow
): Array<{ label: string; value: string }> {
  return resolveAttendanceSessions(row).map(session => {
    const id = `${row.id}-round-${session.round}`
    return {
      label: buildAttendanceSessionFilterLabel(session),
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
  sessionId: string
): SchoolDetailAttendanceStudentRow[] {
  const session = getSchoolDetailAttendanceSessions(row).find(item => item.id === sessionId)
  if (!session) return []
  return cloneAttendanceStudentRows(session.students)
}

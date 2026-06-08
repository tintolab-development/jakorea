import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  type SchoolDetailAttendanceFilters,
  type SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'

function formatSessionDate(date: string, dayOfWeek: string): string {
  const parts = date.split('.').map(part => part.trim())
  if (parts.length >= 3) {
    return `${parts[0]}. ${parts[1]}. ${parts[2]}(${dayOfWeek})`
  }
  return `${date}(${dayOfWeek})`
}

function formatEducationFormat(format: string): string {
  if (format === '오프라인') return '대면'
  return format
}

function formatTimeRange(timeRange: string): string {
  return timeRange.includes('~') ? timeRange.replace(/~/g, ' ~ ') : timeRange
}

/** 회차별 2교시 구간 라벨 (스크린샷 시안) */
function buildPeriodRangeLabel(round: number): string {
  if (round === 1) {
    return '1교시 (9:20 ~ 10:10) ~ 2교시 (10:20 ~ 11:10)'
  }
  if (round === 2) {
    return '3교시 (11:20 ~ 12:10) ~ 4교시 (13:30 ~ 14:20)'
  }
  const classNum = round % 2 === 1 ? '1교시' : '3교시'
  return `${classNum} (${formatTimeRange('9:20~10:10')})`
}

export function buildAttendanceSessionHeaderPrefix(session: ParticipatingSchoolSession): string {
  const dateLabel = formatSessionDate(session.date, session.dayOfWeek)
  const formatLabel = formatEducationFormat(session.format)
  const periodLabel = buildPeriodRangeLabel(session.round)
  return `${session.round}회차 : ${dateLabel} ${session.duration} (${formatLabel}) | ${periodLabel}`
}

export function buildAttendanceSessionFilterLabel(session: ParticipatingSchoolSession): string {
  return `${session.round}회차 · ${formatSessionDate(session.date, session.dayOfWeek)}`
}

export function studentMatchesAttendanceFilters(
  row: SchoolDetailAttendanceStudentRow,
  filters: SchoolDetailAttendanceFilters
): boolean {
  const nameQ = filters.studentName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  if (
    filters.studentGender !== SCHOOL_ATTENDANCE_FILTER_ALL &&
    row.gender !== filters.studentGender
  ) {
    return false
  }
  if (
    filters.studentClass !== SCHOOL_ATTENDANCE_FILTER_ALL &&
    row.gradeClass !== filters.studentClass
  ) {
    return false
  }
  if (
    filters.attendanceStatus !== SCHOOL_ATTENDANCE_FILTER_ALL &&
    row.status !== filters.attendanceStatus
  ) {
    return false
  }
  return true
}

export function filterAttendanceStudentsForDisplay(
  students: SchoolDetailAttendanceStudentRow[],
  filters: SchoolDetailAttendanceFilters
): SchoolDetailAttendanceStudentRow[] {
  const hasStudentFilter =
    filters.studentName.trim() !== '' ||
    filters.studentGender !== SCHOOL_ATTENDANCE_FILTER_ALL ||
    filters.studentClass !== SCHOOL_ATTENDANCE_FILTER_ALL ||
    filters.attendanceStatus !== SCHOOL_ATTENDANCE_FILTER_ALL

  if (!hasStudentFilter) return students
  return students.filter(row => studentMatchesAttendanceFilters(row, filters))
}

export function attendanceStudentRowsEqual(
  a: SchoolDetailAttendanceStudentRow[],
  b: SchoolDetailAttendanceStudentRow[]
): boolean {
  if (a.length !== b.length) return false
  return a.every((row, index) => {
    const other = b[index]
    return (
      row.id === other?.id &&
      row.status === other?.status &&
      row.no === other?.no &&
      row.name === other?.name
    )
  })
}

export function cloneAttendanceStudentRows(
  rows: SchoolDetailAttendanceStudentRow[]
): SchoolDetailAttendanceStudentRow[] {
  return rows.map(row => ({ ...row }))
}

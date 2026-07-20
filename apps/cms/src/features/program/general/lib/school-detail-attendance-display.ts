import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import type { Program } from '@/types/domain'
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

export interface SchoolDetailAttendanceSessionHeaderParts {
  sessionLeadLabel: string
  title: string
  scheduleSummary: string
  periodRangeLabel: string
  headerPrefix: string
}

/**
 * 출석 관리 회차/일정 선행 라벨.
 * - 커리큘럼형: curriculumSessions[].sessionLabel (예: 1회차, 1차시) — 없으면 `${round}회차`
 * - 일정형: scheduleDetails[].name — 없으면 scheduleLabel → 세부 일정 NN
 */
export function resolveSchoolDetailAttendanceSessionLeadLabel(
  program: Program,
  round: number
): string {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (educationStructure === 'schedule') {
    const detail = commonInfo.scheduleDetails?.[round - 1]
    const name = detail?.name?.trim()
    if (name) return name
    const scheduleLabel = detail?.scheduleLabel?.trim()
    if (scheduleLabel) return scheduleLabel
    return `세부 일정 ${String(round).padStart(2, '0')}`
  }

  const sessionLabel = commonInfo.curriculumSessions?.[round - 1]?.sessionLabel?.trim()
  if (sessionLabel) return sessionLabel
  return `${round}회차`
}

export function buildAttendanceSessionHeaderParts(
  session: ParticipatingSchoolSession,
  sessionLeadLabel: string
): SchoolDetailAttendanceSessionHeaderParts {
  const dateLabel = formatSessionDate(session.date, session.dayOfWeek)
  const formatLabel = formatEducationFormat(session.format)
  const periodRangeLabel = buildPeriodRangeLabel(session.round)
  const title = `${sessionLeadLabel} : ${dateLabel}`
  const scheduleSummary = `${session.duration} (${formatLabel})`
  const headerPrefix = `${title} ${scheduleSummary} | ${periodRangeLabel}`
  return { sessionLeadLabel, title, scheduleSummary, periodRangeLabel, headerPrefix }
}

/** @deprecated {@link buildAttendanceSessionHeaderParts} 사용 */
export function buildAttendanceSessionHeaderPrefix(
  session: ParticipatingSchoolSession,
  sessionLeadLabel: string
): string {
  return buildAttendanceSessionHeaderParts(session, sessionLeadLabel).headerPrefix
}

export function buildAttendanceSessionFilterLabel(
  session: ParticipatingSchoolSession,
  sessionLeadLabel: string
): string {
  return `${sessionLeadLabel} · ${formatSessionDate(session.date, session.dayOfWeek)}`
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

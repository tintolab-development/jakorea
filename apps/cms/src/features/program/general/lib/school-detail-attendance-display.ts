import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { buildGeneralProgressSessionTableHeader } from '@/features/program/general/lib/general-progress-session-table-header'
import { formatStudentGradeClassColumnLabel } from '@/features/program/general/lib/student-registered-grade-class-options'
import type { Program } from '@/types/domain'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  type SchoolDetailAttendanceFilters,
  type SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'

function formatSessionDate(date: string, dayOfWeek: string): string {
  const cleaned = date.trim()
  const formatted = formatCmsScheduleDisplayLabel(cleaned)
  if (formatted !== cleaned || /\([월화수목금토일]\)/u.test(formatted)) return formatted
  return formatCmsScheduleDisplayLabel(`${cleaned}(${dayOfWeek})`)
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
  sessionLeadLabel: string,
  program?: Program | null
): SchoolDetailAttendanceSessionHeaderParts {
  const built = buildGeneralProgressSessionTableHeader({
    round: session.round,
    leadLabel: sessionLeadLabel,
    educationScheduleLabel: session.educationScheduleLabel,
    startAt: session.startAt,
    dateLabel: formatSessionDate(session.date, session.dayOfWeek),
    sessionDuration: session.duration,
    sessionFormat: session.format,
    sessionClassNum: session.classNum,
    sessionTimeRange: session.timeRange,
    program,
  })
  return {
    sessionLeadLabel,
    title: built.headerTitle,
    scheduleSummary: built.headerScheduleSummary,
    periodRangeLabel: built.headerPeriodRangeLabel,
    headerPrefix: built.headerPrefix,
  }
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

/** @deprecated {@link formatStudentGradeClassColumnLabel} — 출석 관리 호환 alias */
export function formatSchoolDetailAttendanceClassLabel(gradeClass?: string | null): string {
  return formatStudentGradeClassColumnLabel(gradeClass)
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

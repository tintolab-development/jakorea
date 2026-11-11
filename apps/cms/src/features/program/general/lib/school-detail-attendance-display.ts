import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { buildGeneralProgressSessionTableHeader } from '@/features/program/general/lib/general-progress-session-table-header'
import { formatStudentGradeClassColumnLabel } from '@/features/program/general/lib/student-registered-grade-class-options'
import {
  isPreEducationScheduleBlock,
  PRE_EDUCATION_DISPLAY_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import {
  formatEducationScheduleUnitLabel,
  parseConfirmedCurriculumSessionCount,
  positiveEducationNumber,
} from '@/shared/lib/education-schedule-name'
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

/** 일정 1건 — 선행 라벨 판정에 쓰는 서버 필드(있는 것만) */
export type EducationScheduleLeadLabelSchedule = {
  /** 해당 일정에 연결된 커리큘럼 차시 수(`curriculumSessionCount`). 회차 번호가 아니다 */
  curriculumSessionCount?: number | null
  scheduleRole?: string | null
  educationSlotKey?: string | null
  /**
   * 복수 회차에 `(K차시)`를 붙일지. 기본 true(출석·과제·캘린더).
   * 참여 기관 일정 행 회차명처럼 회차명만 쓰는 화면은 false.
   */
  includeCurriculumSessionCount?: boolean
}

function readCurriculumSessionCountFromRowTitle(title: string | null | undefined): number | null {
  const trimmed = title?.trim() ?? ''
  if (/^\d+$/u.test(trimmed)) return positiveEducationNumber(Number(trimmed))
  return parseConfirmedCurriculumSessionCount(trimmed)
}

/**
 * 출석·과제 패널 제목·[교육 일정] 필터·엑셀 머리글·캘린더 일정 라벨의 선행 라벨 SSOT.
 * 회차와 차시는 다른 개념이다 — 회차 = 교육 일정 단위(`sessionNo`), 차시 = 커리큘럼 수업 단위이며
 * 차시 '개수'를 `N차시`로 쓴다(예: `1회차 (2차시)`). 회차 번호·배열 순서·일정 건수를 `N차시`로,
 * 차시 수를 `N회차`로 쓰지 않는다.
 * - 사전교육(canonical `scheduleRole`/`educationSlotKey`): `사전교육`
 * - 일정형: `scheduleDetails[].name` — 없으면 scheduleLabel → `세부 일정 NN` (round = 회차 순번)
 * - 커리큘럼형 단일 회차(하루 진행, 그날 전 차시): `N차시` —
 *   N = 일정 `curriculumSessionCount`, 없으면 공통정보 `curriculumSessions` 중 사전교육 제외 개수
 * - 커리큘럼형 복수 회차: `N회차`, 차시 수를 알면 `N회차 (K차시)` —
 *   K = 일정 `curriculumSessionCount`, 없으면 그 회차 공통정보 행의 진행 차시 수(`title`)
 */
export function resolveSchoolDetailAttendanceSessionLeadLabel(
  program: Program,
  round: number,
  schedule?: EducationScheduleLeadLabelSchedule | null
): string {
  if (schedule && isProgramSchedulePreEducation(schedule)) return PRE_EDUCATION_DISPLAY_LABEL
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (educationStructure === 'schedule') {
    const detail = (commonInfo.scheduleDetails ?? []).filter(
      row => !isPreEducationScheduleBlock(row)
    )[round - 1]
    const name = detail?.name?.trim()
    if (name) return name
    const scheduleLabel = detail?.scheduleLabel?.trim()
    if (scheduleLabel) return scheduleLabel
    return `세부 일정 ${String(round).padStart(2, '0')}`
  }

  const mainRows = (commonInfo.curriculumSessions ?? []).filter(
    session =>
      !isPreEducationScheduleBlock({
        isPreEducation: session.isPreEducation,
        scheduleLabel: session.sessionLabel,
      })
  )
  const scheduleCount = positiveEducationNumber(schedule?.curriculumSessionCount)

  if (sessionRound === 'single') {
    const count = scheduleCount ?? positiveEducationNumber(mainRows.length)
    return (
      formatEducationScheduleUnitLabel({ curriculumSessionCount: count }) ||
      formatEducationScheduleUnitLabel({ sessionNo: round })
    )
  }

  // 복수 회차 — 회차 행은 sessionNo로 먼저 찾고, 없으면 회차 순번(round)으로 찾는다
  const roundRow =
    mainRows.find(row => positiveEducationNumber(row.sessionNo) === round) ?? mainRows[round - 1]
  const count =
    schedule?.includeCurriculumSessionCount === false
      ? null
      : (scheduleCount ?? readCurriculumSessionCountFromRowTitle(roundRow?.title))
  return (
    formatEducationScheduleUnitLabel({ sessionNo: round, curriculumSessionCount: count }) ||
    `${round}회차`
  )
}

/**
 * 캘린더 셀·팝오버·카드(강사 신청·참여 강사) 일정 선행 라벨 — {@link resolveSchoolDetailAttendanceSessionLeadLabel}와 같은 규칙.
 * 단일 회차는 회차 번호 없이도 `N차시`를 만들 수 있고, 일정형·복수 회차는 `sessionNo`가 있어야 한다.
 * 알 수 없으면 null (호출부는 시간만 표시).
 */
export function resolveEducationScheduleSessionLeadLabel(
  session: Pick<
    ParticipatingSchoolSession,
    'sessionNo' | 'curriculumSessionCount' | 'scheduleRole' | 'educationSlotKey'
  >,
  program: Program | null | undefined
): string | null {
  if (isProgramSchedulePreEducation(session)) return PRE_EDUCATION_DISPLAY_LABEL
  if (!program) return null
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  const roundNumber = positiveEducationNumber(session.sessionNo)
  if (educationStructure === 'curriculum' && sessionRound === 'single') {
    return resolveSchoolDetailAttendanceSessionLeadLabel(program, roundNumber ?? 1, session)
  }
  return roundNumber != null
    ? resolveSchoolDetailAttendanceSessionLeadLabel(program, roundNumber, session)
    : null
}

const SESSION_CLOCK_RANGE_RE = /^\s*(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})\s*$/u

function formatSessionClockRange(timeRange: string | null | undefined): string | null {
  const match = SESSION_CLOCK_RANGE_RE.exec(timeRange ?? '')
  if (!match) return null
  const pad = (h: string, m: string) => `${h.padStart(2, '0')}:${m}`
  const label = `${pad(match[1]!, match[2]!)} ~ ${pad(match[3]!, match[4]!)}`
  return label === '00:00 ~ 00:00' ? null : label
}

const CALENDAR_ROUND_WITH_COUNT_RE = /^(.+?회차) \((\d+차시)\)$/u

/**
 * 캘린더 줄(`{선행 라벨} (시간)`)용 선행 라벨 — 괄호가 두 번 겹치지 않게
 * 복수 회차 `N회차 (K차시)`를 `N회차 · K차시`로 바꾼다. 그 밖의 라벨은 그대로.
 * 출석·과제 패널 제목(`N회차 (K차시) : 날짜`)에는 쓰지 않는다.
 */
export function toCalendarScheduleLeadLabel(lead: string): string
export function toCalendarScheduleLeadLabel(
  lead: string | null | undefined
): string | null | undefined
export function toCalendarScheduleLeadLabel(
  lead: string | null | undefined
): string | null | undefined {
  if (!lead) return lead
  return lead.replace(CALENDAR_ROUND_WITH_COUNT_RE, '$1 · $2')
}

/**
 * `{선행 라벨} (HH:mm ~ HH:mm)` — 선행 라벨을 모르면 시간만, 시간도 없으면 선행 라벨만, 둘 다 없으면 null.
 * 복수 회차 차시 수는 `N회차 · K차시 (시간)` ({@link toCalendarScheduleLeadLabel}).
 * 선행 라벨 규칙은 {@link resolveEducationScheduleSessionLeadLabel}.
 */
export function formatEducationScheduleSessionWithTime(
  session: Pick<
    ParticipatingSchoolSession,
    'sessionNo' | 'curriculumSessionCount' | 'scheduleRole' | 'educationSlotKey' | 'timeRange'
  >,
  program: Program | null | undefined
): string | null {
  const lead = toCalendarScheduleLeadLabel(
    resolveEducationScheduleSessionLeadLabel(session, program)
  )
  const time = formatSessionClockRange(session.timeRange)
  if (lead && time) return `${lead} (${time})`
  return lead ?? time
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

export function hasSchoolDetailAttendanceStudentFilters(
  filters: SchoolDetailAttendanceFilters
): boolean {
  return (
    filters.studentName.trim() !== '' ||
    filters.studentGender !== SCHOOL_ATTENDANCE_FILTER_ALL ||
    filters.studentClass !== SCHOOL_ATTENDANCE_FILTER_ALL ||
    filters.attendanceStatus !== SCHOOL_ATTENDANCE_FILTER_ALL
  )
}

export function isDefaultSchoolDetailAttendanceFilters(
  filters: SchoolDetailAttendanceFilters
): boolean {
  return (
    filters.educationSchedule === SCHOOL_ATTENDANCE_FILTER_ALL &&
    !hasSchoolDetailAttendanceStudentFilters(filters)
  )
}

export function filterAttendanceStudentsForDisplay(
  students: SchoolDetailAttendanceStudentRow[],
  filters: SchoolDetailAttendanceFilters
): SchoolDetailAttendanceStudentRow[] {
  if (!hasSchoolDetailAttendanceStudentFilters(filters)) return students
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
      row.attendanceRecorded === other?.attendanceRecorded &&
      row.participantId === other?.participantId &&
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

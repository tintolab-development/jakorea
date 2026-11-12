import { formatDisplayDateTime } from '../../../../../shared/lib/format-display-date.ts'
import {
  formatEducationScheduleUnitLabel,
  isEducationSchedulePreEducation,
  positiveEducationNumber,
  toDisplayEducationScheduleName,
} from '../../../../../shared/lib/education-schedule-name.ts'

function displayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export const PROGRAM_SCHEDULE_ROLE_PRE_EDUCATION = 'PRE_EDUCATION'

/**
 * 강의보고서·배정 현황이 같은 교육 일정을 같은 의미로 표시할 때 쓰는 입력.
 * 필드는 GET lecture-report-assignments 원본에 있을 때만 채운다.
 */
export type InstructorEducationScheduleDisplayInput = {
  scheduleRole?: string | null
  educationSlotKey?: string | null
  scheduleKind?: string | null
  sessionNo?: number | null
  scheduleName?: string | null
  curriculumSessionCount?: number | null
  /** Gemini 정산 인정 차시. 커리큘럼 차시 수(curriculumSessionCount)와 별개 값이다. */
  recognizedClassCount?: number | null
  startAt?: string | null
  endAt?: string | null
}

function readLooseString(raw: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return null
}

function readLoosePositiveInt(raw: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'number') {
      const n = positiveEducationNumber(value)
      if (n != null) return n
    }
    if (typeof value === 'string') {
      const n = positiveEducationNumber(Number(value.trim()))
      if (n != null) return n
    }
  }
  return null
}

function readCurriculumSessionsLength(raw: Record<string, unknown>): number | null {
  const value = raw.curriculumSessions ?? raw.curriculum_sessions
  return Array.isArray(value) && value.length > 0 ? positiveEducationNumber(value.length) : null
}

/** GET 원본에 있는 canonical 일정 필드만 읽는다. 없는 키는 만들지 않는다. */
export function readInstructorEducationScheduleFields(
  value: unknown,
): Pick<
  InstructorEducationScheduleDisplayInput,
  | 'scheduleRole'
  | 'educationSlotKey'
  | 'scheduleKind'
  | 'sessionNo'
  | 'scheduleName'
  | 'curriculumSessionCount'
> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {
      scheduleRole: null,
      educationSlotKey: null,
      scheduleKind: null,
      sessionNo: null,
      scheduleName: null,
      curriculumSessionCount: null,
    }
  }
  const raw = value as Record<string, unknown>
  return {
    scheduleRole: readLooseString(raw, ['scheduleRole', 'schedule_role']),
    educationSlotKey: readLooseString(raw, ['educationSlotKey', 'education_slot_key']),
    scheduleKind: readLooseString(raw, ['scheduleKind', 'schedule_kind']),
    sessionNo: readLoosePositiveInt(raw, ['sessionNo', 'session_no', 'round', 'roundNumber', 'round_number']),
    scheduleName: readLooseString(raw, ['scheduleName', 'schedule_name']),
    curriculumSessionCount:
      readLoosePositiveInt(raw, [
        'curriculumSessionCount',
        'curriculum_session_count',
        'sessionsPerRound',
        'sessions_per_round',
      ]) ?? readCurriculumSessionsLength(raw),
  }
}

/**
 * 사전교육은 canonical 일정 유형·식별자로만 판별한다.
 * sessionNo=null, scheduleName만으로는 사전교육으로 보지 않는다.
 */
export function isCanonicalPreEducationSchedule(
  item: InstructorEducationScheduleDisplayInput,
): boolean {
  const kind = String(item.scheduleKind ?? '').trim().toUpperCase()
  if (kind === PROGRAM_SCHEDULE_ROLE_PRE_EDUCATION) return true
  return isEducationSchedulePreEducation(item)
}

/**
 * 교육 단위 라벨.
 * 사전교육 → `사전교육`
 * 본교육 회차+차시 → `N회차 (K차시)`
 * 회차만 → `N회차`
 * 확인된 차시만 → `K차시`
 * 회차·커리큘럼 차시가 없고 정산 인정 차시만 있으면(Gemini) → `K차시`
 * 일정형 복수 회차 → 일정명
 * 식별 불가면 빈 문자열. 잘못된 명칭을 만들지 않는다.
 */
export function formatInstructorEducationUnitLabel(
  item: InstructorEducationScheduleDisplayInput,
  options: { useScheduleName?: boolean } = {},
): string {
  if (isCanonicalPreEducationSchedule(item)) return '사전교육'
  if (options.useScheduleName === true) {
    return displayText(item.scheduleName)
  }
  const roundOrSession = formatEducationScheduleUnitLabel({
    sessionNo: item.sessionNo,
    curriculumSessionCount: item.curriculumSessionCount,
    scheduleRole: item.scheduleRole,
    educationSlotKey: item.educationSlotKey,
  })
  if (roundOrSession) return roundOrSession
  const recognized = positiveEducationNumber(item.recognizedClassCount)
  if (recognized != null) return `${recognized}차시`
  return toDisplayEducationScheduleName(item.scheduleName) ?? ''
}

/**
 * 강의보고서 「교육 진행 시간(차시)」의 「진행 차시」 칸.
 * 그 일정에 연결된 커리큘럼 차시 수(curriculumSessionCount) → `K차시`.
 * 회차(sessionNo)·일정명·사전교육 라벨은 넣지 않는다. 차시 수를 모르면 빈 문자열.
 */
export function formatLectureReportProgressSessionLabel(
  item: Pick<InstructorEducationScheduleDisplayInput, 'curriculumSessionCount'>,
): string {
  const count = positiveEducationNumber(item.curriculumSessionCount)
  return count != null ? `${count}차시` : ''
}

export function formatAssignmentEducationUnitLabel(
  item: InstructorEducationScheduleDisplayInput,
  useScheduleName: boolean,
): string {
  return formatInstructorEducationUnitLabel(item, { useScheduleName }) || '-'
}

export function formatLectureReportCardTimeSubtitle(
  item: InstructorEducationScheduleDisplayInput & { timeRange: string },
): string {
  if (isCanonicalPreEducationSchedule(item)) {
    if (!item.timeRange) return '사전교육'
    return `${item.timeRange} 사전교육`
  }
  const session = formatLectureReportProgressSessionLabel(item)
  if (!item.timeRange && !session) return ''
  if (!session) return item.timeRange
  if (!item.timeRange) return session
  return `${item.timeRange} ${session}`
}

function parseDisplayDateTime(value: string | null | undefined): { date: string; time: string } | null {
  if (!value) return null
  const formatted = formatDisplayDateTime(value)
  if (!formatted) return null
  const match = /^(.*) (\d{2}:\d{2})$/.exec(formatted)
  if (!match) return { date: formatted, time: '' }
  return { date: match[1], time: match[2] }
}

/** 배정 현황 「담당 교육 진행 일정」 한 줄. `날짜 시각~시각 | 단위` */
export function formatInstructorEducationScheduleLine(
  item: InstructorEducationScheduleDisplayInput,
  useScheduleName: boolean,
): string {
  const start = parseDisplayDateTime(item.startAt)
  const end = parseDisplayDateTime(item.endAt)
  const date = start?.date || end?.date || '-'
  const time =
    start?.time && end?.time
      ? `${start.time} ~ ${end.time}`
      : start?.time || end?.time || '-'
  const session = formatAssignmentEducationUnitLabel(item, useScheduleName)
  if (!start && !end && session === '-') return '-'
  if (session === '-') return `${date} ${time}`
  return `${date} ${time} ${session}`
}

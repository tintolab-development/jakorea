import dayjs from 'dayjs'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import { formatDateDot, formatDateDotWithWeekday, getSeoulCalendarDate } from '@/shared/utils/date'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

/**
 * 정산 현황(참여 강사·참여 봉사자) 행의 일정 표기 입력.
 * 강사는 정산 목록(`SettlementListItemResponse`), 봉사자는 개인 정산 심사 목록 행에서 같은 이름으로 온다.
 */
export type SettlementScheduleLabelInput = {
  /** 일정 시작 시각(ISO-8601, UTC) */
  scheduleStartAt?: string | null
  /** 일정 종료 시각(ISO-8601, UTC) */
  scheduleEndAt?: string | null
  /** 일정명 — 회차 번호가 없는 일정은 회차 자리에 쓴다(자동 기본명 제외) */
  scheduleName?: string | null
  /** PRE_EDUCATION | EDUCATION | CLOSING | SESSION */
  scheduleKind?: string | null
  /** 회차 번호 — 강사만 있다 */
  sessionOrdinal?: number | null
  /** 시각이 없을 때 쓰는 일정 날짜(강사 정산 목록) */
  lectureDate?: string | null
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const SEOUL_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatIsoDateTime(iso?: string | null): string {
  if (!iso?.trim()) return ''
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso.trim()
  return formatYmdHmWithKoreanWeekday(parsed)
}

export function formatLectureDateOnly(iso?: string | null): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.trim()
  const label = formatDateDot(getSeoulCalendarDate(date))
  return label === '-' ? iso.trim() : label
}

function parseInstant(value?: string | null): Date | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatSeoulTime(date: Date): string {
  return SEOUL_TIME_FORMATTER.format(date)
}

function buildSchedulePeriodParts(input: SettlementScheduleLabelInput): {
  datePart: string
  timePart: string
} {
  const start = parseInstant(input.scheduleStartAt)
  if (start) {
    const end = parseInstant(input.scheduleEndAt)
    const datePart = formatDateDotWithWeekday(getSeoulCalendarDate(start))
    const timePart = end ? `${formatSeoulTime(start)}~${formatSeoulTime(end)}` : formatSeoulTime(start)
    return { datePart: datePart === '-' ? '' : datePart, timePart }
  }
  const rawDate = input.lectureDate?.trim() ?? ''
  const datePart = DATE_ONLY_PATTERN.test(rawDate)
    ? formatDateDotWithWeekday(rawDate)
    : formatIsoDateTime(rawDate) || formatLectureDateOnly(rawDate)
  return { datePart: datePart === '-' ? '' : datePart, timePart: '' }
}

/** 회차 자리 — 사전교육 > N회차 > 일정명(자동 기본명 제외) */
function buildScheduleSessionPart(input: SettlementScheduleLabelInput): string {
  if (input.scheduleKind?.trim().toUpperCase() === 'PRE_EDUCATION') return '사전교육'
  if (input.sessionOrdinal != null && input.sessionOrdinal > 0) return `${input.sessionOrdinal}회차`
  return toDisplayEducationScheduleName(input.scheduleName) ?? ''
}

/**
 * 정산 현황 행 일정 표기 — `YYYY.MM.DD(요일) | HH:MM~HH:MM | 회차 자리` (기획 2026-11-12).
 * 시각은 Asia/Seoul 기준. 있는 부분만 이어 붙이고, 모두 없으면 빈 문자열.
 */
export function buildSettlementScheduleDisplayLabel(input: SettlementScheduleLabelInput): string {
  const { datePart, timePart } = buildSchedulePeriodParts(input)
  const sessionPart = buildScheduleSessionPart(input)
  return [datePart, timePart, sessionPart].filter(Boolean).join(' | ')
}

/** 서버 lectureProgressStatus(SCHEDULED·COMPLETED·GAVE_UP) → 화면 진행 여부. 값이 없으면 null */
export function mapSettlementLectureProgressStatus(
  value: string | null | undefined
): ParticipatingIndividualInstructorLectureProgress | null {
  const status = value?.trim().toUpperCase()
  if (status === 'COMPLETED') return 'completed'
  if (status === 'SCHEDULED') return 'scheduled'
  if (status === 'GAVE_UP') return 'activity_withdrawn'
  return null
}

/** 정렬용 일정 시각(ms). 앞에서부터 처음 읽히는 값을 쓰고, 모두 없으면 null */
export function toSettlementScheduleSortTime(
  ...candidates: Array<string | null | undefined>
): number | null {
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const time = Date.parse(trimmed)
    if (Number.isFinite(time)) return time
  }
  return null
}

/**
 * 정산 현황 행 정렬 — 일정 시작 일시 최신순, 같으면 회차 번호 큰 순(신청 여부와 무관).
 * 시각이 없는 행은 맨 뒤로 보낸다. (기획 2026-11-12 2차 2번)
 */
export function compareSettlementScheduleLatestFirst(
  a: { time: number | null; ordinal?: number | null },
  b: { time: number | null; ordinal?: number | null }
): number {
  if (a.time !== b.time) {
    if (a.time == null) return 1
    if (b.time == null) return -1
    return b.time - a.time
  }
  return (b.ordinal ?? 0) - (a.ordinal ?? 0)
}

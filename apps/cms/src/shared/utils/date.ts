/**
 * CMS 화면 날짜 표시 SSOT (QA-126)
 *
 * - 날짜: YYYY.MM.DD
 * - 날짜+시간: YYYY.MM.DD HH:mm
 * - 날짜+시간+초: YYYY.MM.DD HH:mm:ss
 * - 요일: YYYY.MM.DD(요일) — 점·괄호 앞뒤 공백 없음
 * - 날짜+요일+시분: YYYY.MM.DD(요일) HH:mm
 * - 기간: YYYY.MM.DD ~ YYYY.MM.DD
 *
 * 생년월일 표시는 이 모듈을 쓰지 않는다.
 */

import dayjs, { type Dayjs } from 'dayjs'

export type CmsDateInput = Date | string | number | Dayjs | null | undefined

export const CMS_WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const defaultLocale = 'ko-KR'

function parseDisplayDate(value: Date | string | number | Dayjs) {
  if (dayjs.isDayjs(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // 날짜만·점 구분(2026.1.2) 패딩. ISO date-time(`…T…`)은 T를 유지해 dayjs가 파싱되게 한다.
    const dotted = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})/.exec(trimmed)
    if (dotted) {
      const iso = `${dotted[1]}-${dotted[2].padStart(2, '0')}-${dotted[3].padStart(2, '0')}`
      const rest = trimmed.slice(dotted[0].length).trim()
      if (!rest) return dayjs(iso)
      if (rest.startsWith('T') || rest.startsWith('t')) return dayjs(`${iso}${rest}`)
      return dayjs(`${iso} ${rest}`)
    }
  }
  return dayjs(value)
}

function weekdayLabel(parsed: Dayjs): string {
  return CMS_WEEKDAY_KO[parsed.day()] ?? ''
}

function emptyOrInvalid(value: CmsDateInput): value is null | undefined | '' {
  return value == null || value === ''
}

/** 목록 등 날짜(시간 제외) 표시 — 예: 2026.04.20 */
export function formatDateDot(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD')
}

/**
 * @deprecated 표시는 `formatDateDot`(공백 없음)을 쓴다. 호출 호환용 별칭.
 */
export function formatDateSpaced(value: CmsDateInput): string {
  return formatDateDot(value)
}

/** 목록 등 날짜+시간 표시 — 예: 2026.04.20 09:30 */
export function formatDateTimeDot(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD HH:mm')
}

/** 목록 등 날짜+시간+초 표시 — 예: 2026.04.20 09:30:42 */
export function formatDateTimeSecondsDot(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD HH:mm:ss')
}

/** 요일 포함 날짜 — 예: 2026.04.20(월) */
export function formatDateDotWithWeekday(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return `${parsed.format('YYYY.MM.DD')}(${weekdayLabel(parsed)})`
}

/** 출결 정정 설명문 날짜 — 예: 1월 9일(금) */
export function formatMonthDayWithWeekday(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  const weekday = weekdayLabel(parsed)
  if (!weekday) return '-'
  return `${parsed.month() + 1}월 ${parsed.date()}일(${weekday})`
}

/** 요일 포함 날짜+시분 — 예: 2026.04.20(월) 09:30 */
export function formatDateTimeDotWithWeekday(value: CmsDateInput): string {
  if (emptyOrInvalid(value)) return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return `${parsed.format('YYYY.MM.DD')}(${weekdayLabel(parsed)}) ${parsed.format('HH:mm')}`
}

/** 목록 기간 표시 — 예: 2026.04.20 ~ 2026.11.20 */
export function formatDateRangeDot(start: CmsDateInput, end: CmsDateInput): string {
  if (emptyOrInvalid(start) || emptyOrInvalid(end)) return '-'
  const startLabel = formatDateDot(start)
  const endLabel = formatDateDot(end)
  if (startLabel === '-' || endLabel === '-') return '-'
  return `${startLabel} ~ ${endLabel}`
}

/** 요일 포함 기간 — 예: 2026.04.20(월) ~ 2026.11.20(금) */
export function formatDateRangeDotWithWeekday(start: CmsDateInput, end: CmsDateInput): string {
  if (emptyOrInvalid(start) || emptyOrInvalid(end)) return '-'
  const startLabel = formatDateDotWithWeekday(start)
  const endLabel = formatDateDotWithWeekday(end)
  if (startLabel === '-' || endLabel === '-') return '-'
  return `${startLabel} ~ ${endLabel}`
}

export function formatDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
) {
  if (value == null || value === '') return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(defaultLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(date)
}

export function timeSince(value: Date | string | number) {
  const input = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - input.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

/**
 * 목록·화면 텍스트 공통 정책
 * - 날짜: YYYY.MM.DD (월·일 2자리)
 * - 날짜+시간: YYYY.MM.DD HH:mm
 * - 숫자: 천단위 구분, 후행 0 제거
 */

import dayjs, { type Dayjs } from 'dayjs'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function koreanWeekdayLabel(value: Dayjs): string {
  return WEEKDAY_KO[value.day()] ?? ''
}

function parseDisplayDate(value: Date | string | number | Dayjs) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // ISO-8601 (`2026-09-20T01:00:00Z`) — 아래 날짜 정규식이 `T` 앞만 잘라
    // `2026-09-20 T01:00:00Z` 로 합치면 dayjs가 invalid가 된다.
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return dayjs(trimmed)
    }
    const dotted = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})/.exec(trimmed)
    if (dotted) {
      const iso = `${dotted[1]}-${dotted[2].padStart(2, '0')}-${dotted[3].padStart(2, '0')}`
      const rest = trimmed.slice(dotted[0].length).trim()
      return dayjs(rest ? `${iso} ${rest}` : iso)
    }
  }
  return dayjs(value)
}

export function formatDateDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD')
}

export function formatDateTimeDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD HH:mm')
}

/** `YYYY.MM.DD(금) HH:mm` — dayjs `ddd` 영문 요일 사용 금지 */
type DisplayDateInput = Date | string | number | Dayjs | null | undefined

export function formatDateTimeDotWithKoreanWeekday(value: DisplayDateInput): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return `${parsed.format('YYYY.MM.DD')}(${koreanWeekdayLabel(parsed)}) ${parsed.format('HH:mm')}`
}

/** `2026년 04월 03일(금)` */
export function formatKoreanYearMonthDayWithWeekday(value: DisplayDateInput): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return `${parsed.format('YYYY년 MM월 DD일')}(${koreanWeekdayLabel(parsed)})`
}

export function formatDateRangeDot(
  start: Date | string | number | null | undefined,
  end: Date | string | number | null | undefined
): string {
  if (start == null || start === '' || end == null || end === '') return '-'
  const startLabel = formatDateDot(start)
  const endLabel = formatDateDot(end)
  if (startLabel === '-' || endLabel === '-') return '-'
  return `${startLabel} ~ ${endLabel}`
}

export function formatNumberDisplay(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(numeric)) return '-'
  return numeric.toLocaleString('ko-KR', { maximumFractionDigits: 20 })
}

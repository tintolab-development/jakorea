import type { Dayjs } from 'dayjs'

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export function koreanWeekdayLabel(value: Dayjs): string {
  return WEEKDAY_KO[value.day()] ?? ''
}

/** `26년 4월 20일(월)` — 교육 진행 일정 등 */
export function formatShortYearMdWithKoreanWeekday(value: Dayjs): string {
  const yy = String(value.year()).slice(-2)
  return `${yy}년 ${value.month() + 1}월 ${value.date()}일(${koreanWeekdayLabel(value)})`
}

/** DatePicker 표시와 동일 — `YYYY. MM. DD(금)` */
export function formatYmdWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('YYYY. MM. DD')}(${koreanWeekdayLabel(value)})`
}

export function formatYyMdSpacedWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('YY. MM. DD')} (${koreanWeekdayLabel(value)})`
}

export function formatYmdSpacedParenWeekday(value: Dayjs): string {
  return `${value.format('YYYY. MM. DD')} (${koreanWeekdayLabel(value)})`
}

export function formatYmdCompactWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('YYYY.MM.DD')} (${koreanWeekdayLabel(value)})`
}

export function formatYmdCompactNoSpaceWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('YYYY.MM.DD')}(${koreanWeekdayLabel(value)})`
}

export function formatMmDdWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('MM/DD')} (${koreanWeekdayLabel(value)})`
}

export function formatYmdHmWithKoreanWeekday(value: Dayjs): string {
  return `${value.format('YYYY. MM. DD')}(${koreanWeekdayLabel(value)}) ${value.format('HH:mm')}`
}

export function formatKoreanYearMonthDayWithWeekday(value: Dayjs): string {
  return `${value.format('YYYY년 MM월 DD일')}(${koreanWeekdayLabel(value)})`
}

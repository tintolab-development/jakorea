import type { Dayjs } from 'dayjs'
import {
  CMS_WEEKDAY_KO,
  formatDateDotWithWeekday,
  formatDateTimeDotWithWeekday,
} from '@/shared/utils/date'

export const WEEKDAY_KO = CMS_WEEKDAY_KO

export function koreanWeekdayLabel(value: Dayjs): string {
  return WEEKDAY_KO[value.day()] ?? ''
}

function compactWeekdayOrEmpty(value: Dayjs): string {
  const label = formatDateDotWithWeekday(value)
  return label === '-' ? '' : label
}

function compactWeekdayDateTimeOrEmpty(value: Dayjs): string {
  const label = formatDateTimeDotWithWeekday(value)
  return label === '-' ? '' : label
}

/** QA-126 — `2026.04.20(월)` */
export function formatYmdCompactNoSpaceWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** @deprecated `formatYmdCompactNoSpaceWithKoreanWeekday`와 동일 */
export function formatShortYearMdWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** DatePicker 표시 — `2026.04.20(금)` */
export function formatYmdWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** @deprecated `formatYmdCompactNoSpaceWithKoreanWeekday`와 동일 */
export function formatYyMdSpacedWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** @deprecated `formatYmdCompactNoSpaceWithKoreanWeekday`와 동일 */
export function formatYmdSpacedParenWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** @deprecated `formatYmdCompactNoSpaceWithKoreanWeekday`와 동일 */
export function formatYmdCompactWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

/** @deprecated `formatYmdCompactNoSpaceWithKoreanWeekday`와 동일 */
export function formatMmDdWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayOrEmpty(value)
}

export function formatYmdHmWithKoreanWeekday(value: Dayjs): string {
  return compactWeekdayDateTimeOrEmpty(value)
}

/** 일정 선택 UI 예외 — `2026년 4월 20일(월)` (연 4자리, 월·일 비패딩) */
export function formatKoreanYearMonthDayWithWeekday(value: Dayjs): string {
  if (!value.isValid()) return ''
  const weekday = koreanWeekdayLabel(value)
  if (!weekday) return ''
  return `${value.year()}년 ${value.month() + 1}월 ${value.date()}일(${weekday})`
}

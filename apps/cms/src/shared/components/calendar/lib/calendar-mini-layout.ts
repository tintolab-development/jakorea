import type { Dayjs } from 'dayjs'

/** 미니 캘린더 tbody 행 수 — 일요일 시작(en locale) 기준, 4~6주 */
export function countMiniCalendarWeekRows(month: Dayjs): number {
  const firstWeekday = month.startOf('month').day()
  return Math.ceil((firstWeekday + month.daysInMonth()) / 7)
}

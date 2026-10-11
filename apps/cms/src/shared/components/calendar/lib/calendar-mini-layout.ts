import type { Dayjs } from 'dayjs'

/** 미니 캘린더 tbody 행 수 — 일요일 시작(en locale) 기준, 4~6주 */
export function countMiniCalendarWeekRows(month: Dayjs): number {
  const firstWeekday = month.startOf('month').day()
  return Math.ceil((firstWeekday + month.daysInMonth()) / 7)
}

const WEEKDAY_LABELS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

export function miniCalendarWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS_EN
}

/** 일요일 시작 그리드 — `countMiniCalendarWeekRows`와 동일한 주 수 */
export function buildMiniCalendarGridDays(month: Dayjs): Dayjs[] {
  const weekRows = countMiniCalendarWeekRows(month)
  const gridStart = month.startOf('month').subtract(month.startOf('month').day(), 'day')
  const totalCells = weekRows * 7
  return Array.from({ length: totalCells }, (_, index) => gridStart.add(index, 'day'))
}

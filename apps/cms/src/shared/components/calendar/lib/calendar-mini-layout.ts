import type { Dayjs } from 'dayjs'
import { CALENDAR_MINI_WEEKDAY_LABELS } from './calendar-weekday-labels'

/**
 * 월 그리드 주(행) 수 — 일요일 시작 기준, 4~6주.
 * 미니 캘린더와 월간 CalendarMain(antd Calendar 6행 중 필요한 행만 표시) 공용.
 */
export function countMiniCalendarWeekRows(month: Dayjs): number {
  const firstWeekday = month.startOf('month').day()
  return Math.ceil((firstWeekday + month.daysInMonth()) / 7)
}

export function miniCalendarWeekdayLabels(): readonly string[] {
  return CALENDAR_MINI_WEEKDAY_LABELS
}

/** 일요일 시작 그리드 — `countMiniCalendarWeekRows`와 동일한 주 수 */
export function buildMiniCalendarGridDays(month: Dayjs): Dayjs[] {
  const weekRows = countMiniCalendarWeekRows(month)
  const gridStart = month.startOf('month').subtract(month.startOf('month').day(), 'day')
  const totalCells = weekRows * 7
  return Array.from({ length: totalCells }, (_, index) => gridStart.add(index, 'day'))
}

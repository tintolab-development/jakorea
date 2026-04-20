import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { MonthView } from './ui/month-view'

export type CalendarBodyProps = {
  mode: 'month' | 'week'
  currentMonth: Dayjs
  monthFullCellRender: (date: Dayjs) => ReactNode
  /** 주간: 시간 격자(가로 날짜·세로 0~23시). `mode === 'week'`일 때 필수 */
  weekView: ReactNode
}

export function CalendarBody({
  mode,
  currentMonth,
  monthFullCellRender,
  weekView,
}: CalendarBodyProps) {
  return mode === 'week' ? (
    weekView
  ) : (
    <MonthView currentMonth={currentMonth} fullCellRender={monthFullCellRender} />
  )
}

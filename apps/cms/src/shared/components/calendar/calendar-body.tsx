import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { MonthView } from './ui/month-view'
import { WeekView } from './ui/week-view'

export type CalendarBodyProps = {
  mode: 'month' | 'week'
  currentMonth: Dayjs
  weekDates: Dayjs[]
  monthFullCellRender: (date: Dayjs) => ReactNode
  weekRenderDay: (date: Dayjs) => ReactNode
}

export function CalendarBody({
  mode,
  currentMonth,
  weekDates,
  monthFullCellRender,
  weekRenderDay,
}: CalendarBodyProps) {
  return mode === 'week' ? (
    <WeekView weekDates={weekDates} renderDay={weekRenderDay} />
  ) : (
    <MonthView currentMonth={currentMonth} fullCellRender={monthFullCellRender} />
  )
}

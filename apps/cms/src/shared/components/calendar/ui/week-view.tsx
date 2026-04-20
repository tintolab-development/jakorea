import { Fragment, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type WeekViewProps = {
  weekDates: Dayjs[]
  renderDay: (date: Dayjs) => ReactNode
}

export function WeekView({ weekDates, renderDay }: WeekViewProps) {
  return (
    <div className="calendar-week">
      <div className="calendar-week-header">
        {weekdayNames.map(day => (
          <div key={day} className="calendar-week-header-cell">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-week-body">
        {weekDates.map(date => (
          <Fragment key={date.format('YYYY-MM-DD')}>{renderDay(date)}</Fragment>
        ))}
      </div>
    </div>
  )
}

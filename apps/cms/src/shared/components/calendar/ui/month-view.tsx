import { Calendar } from 'antd'
import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'

export type MonthViewProps = {
  currentMonth: Dayjs
  fullCellRender: (date: Dayjs) => ReactNode
}

export function MonthView({ currentMonth, fullCellRender }: MonthViewProps) {
  return (
    <Calendar
      fullscreen={false}
      value={currentMonth}
      headerRender={() => null}
      fullCellRender={fullCellRender}
    />
  )
}

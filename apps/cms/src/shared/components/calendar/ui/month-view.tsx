import { Calendar } from 'antd'
import type { CalendarProps } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { CALENDAR_MONTH_WEEKDAY_LABELS } from '../lib/calendar-weekday-labels'

export type MonthViewProps = {
  currentMonth: Dayjs
  fullCellRender: (date: Dayjs) => ReactNode
}

/**
 * 월간 요일 헤더 — Figma 12432:438814 등 `일요일`…`토요일`.
 * 전역 dayjs locale을 바꾸지 않고 이 Calendar에만 `shortWeekDays`를 넘긴다.
 * (`locale.locale`은 en 유지 → 주 시작 일요일·그리드 시작일 계산 불변)
 */
const MONTH_VIEW_LOCALE: CalendarProps<Dayjs>['locale'] = {
  ...enUS,
  lang: {
    ...enUS.lang,
    shortWeekDays: [...CALENDAR_MONTH_WEEKDAY_LABELS],
  },
}

export function MonthView({ currentMonth, fullCellRender }: MonthViewProps) {
  return (
    <Calendar
      fullscreen={false}
      value={currentMonth}
      locale={MONTH_VIEW_LOCALE}
      headerRender={() => null}
      fullCellRender={fullCellRender}
    />
  )
}

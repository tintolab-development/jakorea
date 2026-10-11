import type { ReactNode } from 'react'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { defaultCalendarMonthEventTitle } from '@/shared/components/calendar/ui/calendar-month-event-title'
import {
  resolveGeneralInstructorCalendarEventTitle,
  type ApplicantInstructorCalendarEventItem,
} from './applicant-calendar-events'

export function renderGeneralInstructorCalendarMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: { text: string }
}): ReactNode {
  const nested = row.sourceEvent?.original as { originalItem?: unknown } | undefined
  const item = (nested?.originalItem ?? nested) as ApplicantInstructorCalendarEventItem | undefined
  const label = resolveGeneralInstructorCalendarEventTitle(
    item,
    String(row.sourceEvent?.title ?? '')
  )

  return defaultCalendarMonthEventTitle(label || '강사', colors.text)
}

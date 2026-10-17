import type { ReactNode } from 'react'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import {
  formatGeneralInstructorCalendarCellTitleParts,
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
  const parts = formatGeneralInstructorCalendarCellTitleParts(item)

  return (
    <CalendarMonthEventTitleWithDivider parts={parts} accentColor={colors.text} />
  )
}

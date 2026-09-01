import type { ReactNode } from 'react'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { defaultCalendarMonthEventTitle } from '@/shared/components/calendar/ui/calendar-month-event-title'

type InstructorCalendarEventOriginal = {
  schoolName?: string
}

export function renderGeneralInstructorCalendarMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: { text: string }
}): ReactNode {
  const nested = row.sourceEvent?.original as { originalItem?: unknown } | undefined
  const item = (nested?.originalItem ?? nested) as InstructorCalendarEventOriginal | undefined
  const schoolName = String(item?.schoolName ?? row.sourceEvent?.title ?? '').trim()

  if (schoolName) {
    return defaultCalendarMonthEventTitle(schoolName, colors.text)
  }

  return defaultCalendarMonthEventTitle(String(row.sourceEvent?.title ?? ''), colors.text)
}

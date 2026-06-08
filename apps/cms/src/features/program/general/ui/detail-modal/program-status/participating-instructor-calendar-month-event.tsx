import type { ReactNode } from 'react'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import type { ParticipatingInstructorCalendarEventItem } from '@/features/program/general/lib/build-participating-instructor-calendar-events'

function resolveInstructorCalendarEventItem(
  row: CalendarMonthCellRow
): ParticipatingInstructorCalendarEventItem | undefined {
  const nested = row.sourceEvent?.original as { originalItem?: ParticipatingInstructorCalendarEventItem } | undefined
  return nested?.originalItem
}

export function renderParticipatingInstructorCalendarMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: { text: string }
}): ReactNode {
  const item = resolveInstructorCalendarEventItem(row)
  const schoolName = String(item?.row.schoolName ?? row.sourceEvent?.title ?? '').trim()
  const instructorName = String(item?.instructorName ?? '').trim()

  if (schoolName && instructorName) {
    return (
      <CalendarMonthEventTitleWithDivider
        parts={{ left: schoolName, right: instructorName }}
        accentColor={colors.text}
      />
    )
  }

  return (
    <span className="calendar-event-title" style={{ color: colors.text }}>
      {schoolName || '-'}
    </span>
  )
}

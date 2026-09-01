import type { ReactNode } from 'react'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import type { ParticipatingVolunteerCalendarEventItem } from '@/features/program/general/lib/build-participating-volunteer-calendar-events'

function resolveVolunteerCalendarEventItem(
  row: CalendarMonthCellRow
): ParticipatingVolunteerCalendarEventItem | undefined {
  const nested = row.sourceEvent?.original as { originalItem?: ParticipatingVolunteerCalendarEventItem } | undefined
  return nested?.originalItem
}

export function renderParticipatingVolunteerCalendarMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: { text: string }
}): ReactNode {
  const item = resolveVolunteerCalendarEventItem(row)
  const schoolName = String(item?.row.schoolName ?? '').trim()
  const volunteerName = String(item?.volunteerName ?? row.sourceEvent?.title ?? '').trim()

  if (schoolName && volunteerName) {
    return (
      <CalendarMonthEventTitleWithDivider
        parts={{ left: schoolName, right: volunteerName }}
        accentColor={colors.text}
      />
    )
  }

  return (
    <span className="calendar-event-title" style={{ color: colors.text }}>
      {volunteerName || schoolName || '-'}
    </span>
  )
}

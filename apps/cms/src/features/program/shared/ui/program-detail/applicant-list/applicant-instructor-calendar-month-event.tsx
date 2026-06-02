import type { ReactNode } from 'react'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'

type InstructorCalendarEventOriginal = {
  schoolName?: string
  calendarInstitutionSummary?: { applicantCount: number; regionDisplay: string }
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
  const summary = item?.calendarInstitutionSummary
  const schoolName = String(item?.schoolName ?? '').trim()

  if (summary && schoolName) {
    return (
      <CalendarMonthEventTitleWithDivider
        parts={{
          left: schoolName,
          right: String(summary.applicantCount),
        }}
        accentColor={colors.text}
      />
    )
  }

  const title = String(row.sourceEvent?.title ?? '').replace(/^\[.*?\]\s*/, '').trim()
  return (
    <span className="calendar-event-title" style={{ color: colors.text }}>
      {title || '-'}
    </span>
  )
}

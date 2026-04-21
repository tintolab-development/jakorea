import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { ApplicantCalendarEventPopoverContent } from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import type { CalendarItem } from '../../model/calendar-item'

function calendarItemsToPopoverRows(
  items: CalendarItem[]
): Array<{ id: string | number; title?: string; originalItem?: unknown }> {
  return items.map(item => {
    const o = item.original
    const nested =
      o != null && typeof o === 'object' && 'originalItem' in o
        ? (o as { originalItem?: unknown }).originalItem
        : o
    return {
      id: item.id,
      title: item.title,
      originalItem: nested,
    }
  })
}

/** `CalendarMain` / `buildEventsPreview` 기본 — `CalendarItem` 행을 신청자 패널 형식으로 표시 */
export function renderProgramApplicantPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <ApplicantCalendarEventPopoverContent
      events={calendarItemsToPopoverRows(events)}
      colorMap={colorMap}
    />
  )
}

/** `ProgramCalendar` 이벤트 모드 기본 툴팁 */
export function renderProgramCalendarEventsDefaultTooltipContent({
  events,
  colorMap,
}: {
  events: Array<{ id: string | number; title?: string; originalItem?: unknown }>
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return <ApplicantCalendarEventPopoverContent events={events} colorMap={colorMap} />
}

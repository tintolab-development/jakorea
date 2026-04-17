import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type CalendarEventItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  originalItem?: unknown
}

function getEventsForDate(events: CalendarEventItem[], date: Dayjs): CalendarEventItem[] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  })
}

export function useDayEvents(
  events: CalendarEventItem[],
  date: Dayjs,
  buildResolvedColorMap: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>,
  overrideEventColorMap?: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
): {
  dayEvents: CalendarEventItem[]
  hasEvents: boolean
  colorMap: Map<string | number, ScheduleColorPair>
} {
  const dayEvents = useMemo(() => getEventsForDate(events, date), [events, date])
  const colorMap = useMemo(
    () =>
      overrideEventColorMap != null
        ? overrideEventColorMap(dayEvents)
        : buildResolvedColorMap(dayEvents),
    [dayEvents, overrideEventColorMap, buildResolvedColorMap]
  )

  return {
    dayEvents,
    hasEvents: dayEvents.length > 0,
    colorMap,
  }
}


import type { CalendarLegendItem } from './calendar-legend'
import type { CalendarDay } from './calendar-month'
import { startOfDay } from './calendar-month'

export const CALENDAR_MAX_VISIBLE_LANES = 2

export type PFCalendarEvent = {
  id: string
  label: string
  type: CalendarLegendItem['key']
  startDate: Date | string
  endDate: Date | string
}

export type CalendarEventSegment = {
  eventId: string
  label: string
  type: CalendarLegendItem['key']
  lane: number
  /** 0–6 inclusive */
  startCol: number
  /** 0–6 inclusive */
  endCol: number
  isRangeStart: boolean
  isRangeEnd: boolean
}

export type CalendarWeekLayout = {
  days: CalendarDay[]
  segments: CalendarEventSegment[]
  /** day index 0–6 → overflow count */
  overflowByCol: number[]
}

function parseDate(value: Date | string): Date {
  if (value instanceof Date) {
    return startOfDay(value)
  }

  const [year, month, day] = value.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

function toTime(date: Date): number {
  return date.getTime()
}

function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }
  return weeks
}

function compareEvents(a: PFCalendarEvent, b: PFCalendarEvent): number {
  const aStart = toTime(parseDate(a.startDate))
  const bStart = toTime(parseDate(b.startDate))
  if (aStart !== bStart) return aStart - bStart

  const aEnd = toTime(parseDate(a.endDate))
  const bEnd = toTime(parseDate(b.endDate))
  // longer first for stabler packing
  return bEnd - aEnd
}

export function buildCalendarWeekLayouts(
  days: CalendarDay[],
  events: PFCalendarEvent[],
): CalendarWeekLayout[] {
  const normalized = events.map(event => ({
    ...event,
    start: parseDate(event.startDate),
    end: parseDate(event.endDate),
  }))

  return chunkWeeks(days).map(weekDays => {
    const weekStart = weekDays[0].date
    const weekEnd = weekDays[6].date
    const weekStartTime = toTime(weekStart)
    const weekEndTime = toTime(weekEnd)

    const overlapping = normalized
      .filter(event => toTime(event.start) <= weekEndTime && toTime(event.end) >= weekStartTime)
      .sort((a, b) => compareEvents(a, b))

    const laneEnds: number[] = []
    const segments: CalendarEventSegment[] = []
    const overflowByCol = Array.from({ length: 7 }, () => 0)

    for (const event of overlapping) {
      const clippedStart = toTime(event.start) < weekStartTime ? weekStart : event.start
      const clippedEnd = toTime(event.end) > weekEndTime ? weekEnd : event.end
      const startCol = weekDays.findIndex(day => toTime(day.date) === toTime(clippedStart))
      const endCol = weekDays.findIndex(day => toTime(day.date) === toTime(clippedEnd))
      if (startCol < 0 || endCol < 0) continue

      let lane = laneEnds.findIndex(endColExclusive => endColExclusive <= startCol)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(endCol + 1)
      } else {
        laneEnds[lane] = endCol + 1
      }

      if (lane >= CALENDAR_MAX_VISIBLE_LANES) {
        for (let col = startCol; col <= endCol; col += 1) {
          overflowByCol[col] += 1
        }
        continue
      }

      segments.push({
        eventId: event.id,
        label: event.label,
        type: event.type,
        lane,
        startCol,
        endCol,
        isRangeStart: toTime(clippedStart) === toTime(event.start),
        isRangeEnd: toTime(clippedEnd) === toTime(event.end),
      })
    }

    return { days: weekDays, segments, overflowByCol }
  })
}

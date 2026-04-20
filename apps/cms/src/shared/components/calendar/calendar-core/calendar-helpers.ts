import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { DateValue } from '@/types'
import type { Program } from '@/types/domain'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const CALENDAR_ITEM_TYPE = 'event' as const

export type CalendarItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  type: typeof CALENDAR_ITEM_TYPE
  original: unknown
}

export function isProgramOriginal(o: unknown): o is Program {
  if (o === null || typeof o !== 'object') return false
  return 'sponsorId' in o && 'rounds' in o
}

export function dateValueToCalendarString(value: DateValue): string {
  return typeof value === 'string' ? value : value.toISOString()
}

export function mapEventsToItems(
  events: Array<Pick<CalendarItem, 'id' | 'title' | 'startDate' | 'endDate'> & { originalItem?: unknown }>
): CalendarItem[] {
  return events.map(event => ({
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    type: CALENDAR_ITEM_TYPE,
    original: event,
  }))
}

export function getItemsForDate(items: CalendarItem[], date: Dayjs): CalendarItem[] {
  return items.filter(item => {
    const start = dayjs(item.startDate)
    const end = dayjs(item.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  })
}

/** 하루 칸 중 `original`이 Program인 항목만 모아 동일 프로그램 id 기준으로 중복 제거 */
export function uniqueScheduleSourcesForDay(dayItems: CalendarItem[]): Program[] {
  const seen = new Set<string>()
  const out: Program[] = []
  for (const item of dayItems) {
    if (!isProgramOriginal(item.original)) continue
    const program = item.original
    const key = String(program.id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(program)
  }
  return out
}

/** 이벤트 모드: 해당 일의 항목 중 Program 기반이 아닌 캘린더 행만 */
export function calendarItemsForEventMode(dayItems: CalendarItem[]): CalendarItem[] {
  return dayItems.filter(item => !isProgramOriginal(item.original))
}

export function resolveItemColor(
  item: CalendarItem,
  map: Map<string | number, ScheduleColorPair>,
  fallback: ScheduleColorPair
): ScheduleColorPair {
  return map.get(item.id) ?? fallback
}

export function calendarItemForScheduleSource(source: Program): CalendarItem {
  return {
    id: source.id,
    title: source.title,
    startDate: dateValueToCalendarString(source.startDate),
    endDate: dateValueToCalendarString(source.endDate),
    type: CALENDAR_ITEM_TYPE,
    original: source,
  }
}

export function calendarItemForEventRow(
  row: Pick<CalendarItem, 'id' | 'title' | 'startDate' | 'endDate'> & { originalItem?: unknown }
): CalendarItem {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    type: CALENDAR_ITEM_TYPE,
    original: row,
  }
}

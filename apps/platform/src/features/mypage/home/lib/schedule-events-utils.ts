import type { MypageScheduleEvent } from '../model/schedule-types'

export function formatMypageScheduleBarLabel(event: MypageScheduleEvent): string {
  return `${event.programName} ${event.title}`
}

export function getMypageScheduleEventsOnDate(
  events: MypageScheduleEvent[],
  date: Date,
): MypageScheduleEvent[] {
  const key = toDateKey(date)
  return events.filter(event => event.startDate <= key && key <= event.endDate)
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getMypageScheduleDatesInMonth(
  events: MypageScheduleEvent[],
  month: Date,
): Date[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)
  const startKey = toDateKey(monthStart)
  const endKey = toDateKey(monthEnd)
  const dateKeys = new Set<string>()

  for (const event of events) {
    if (event.endDate < startKey || event.startDate > endKey) continue

    const rangeStart = event.startDate < startKey ? monthStart : parseDateKey(event.startDate)
    const rangeEnd = event.endDate > endKey ? monthEnd : parseDateKey(event.endDate)

    for (
      let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
      cursor.getTime() <= rangeEnd.getTime();
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    ) {
      dateKeys.add(toDateKey(cursor))
    }
  }

  return [...dateKeys].sort().map(parseDateKey)
}

export function syncSelectedDateToMonth(
  month: Date,
  selectedDate: Date,
  events: MypageScheduleEvent[],
): Date {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()

  if (selectedDate.getFullYear() === year && selectedDate.getMonth() === monthIndex) {
    return new Date(year, monthIndex, selectedDate.getDate())
  }

  const datesInMonth = getMypageScheduleDatesInMonth(events, month)
  if (datesInMonth.length > 0) {
    return datesInMonth[0]
  }

  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(selectedDate.getDate(), lastDay)
  return new Date(year, monthIndex, day)
}

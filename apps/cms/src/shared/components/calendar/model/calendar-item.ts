export const CALENDAR_ITEM_TYPE = 'event' as const

export type CalendarItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  type: typeof CALENDAR_ITEM_TYPE
  original: unknown
}

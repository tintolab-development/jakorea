import type { CalendarLegendItem } from './calendar-legend'

export type CalendarEventColor = {
  accent: string
  background: string
}

export const CALENDAR_EVENT_COLORS: Record<CalendarLegendItem['key'], CalendarEventColor> = {
  assignment: { accent: '#F5CC00', background: '#FFF8D6' },
  satisfaction: { accent: '#557BFA', background: '#E8EEFF' },
  survey: { accent: '#FA8484', background: '#FFE8E8' },
  receipt: { accent: '#9EE9F7', background: '#E8F9FC' },
  education: { accent: '#C593FF', background: '#F3E9FF' },
  program: { accent: '#9FE35B', background: '#EEFBD9' },
}

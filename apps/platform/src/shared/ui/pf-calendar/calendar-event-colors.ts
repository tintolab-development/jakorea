import type { CalendarLegendItem } from './calendar-legend'

export type CalendarEventColor = {
  accent: string
  background: string
}

/**
 * accent(범례·좌측 border)는 기존 유지.
 * background는 지정 연한 5색만 사용 (education은 연한 파란색 재사용).
 */
export const CALENDAR_EVENT_COLORS: Record<CalendarLegendItem['key'], CalendarEventColor> = {
  assignment: { accent: '#F5CC00', background: '#FFF7CF' },
  satisfaction: { accent: '#557BFA', background: '#E0E7FF' },
  survey: { accent: '#FA8484', background: '#FFE3E3' },
  receipt: { accent: '#9EE9F7', background: '#E3FAFF' },
  education: { accent: '#C593FF', background: '#E0E7FF' },
  program: { accent: '#9FE35B', background: '#E7F7D7' },
}

import type { CalendarScheduleEventKey } from './calendar-legend'

export type CalendarEventColor = {
  accent: string
  background: string
}

/** Figma 나의 홈 — 유형별 칩 테두리·배경색 */
export const CALENDAR_EVENT_COLORS: Record<CalendarScheduleEventKey, CalendarEventColor> = {
  assignment: { accent: '#F5CC00', background: '#FFF7CF' },
  satisfaction: { accent: '#557BFA', background: '#E0E7FF' },
  survey: { accent: '#FA8484', background: '#FFE3E3' },
  receipt: { accent: '#9EE9F7', background: '#E3FAFF' },
  education: { accent: '#9FE35B', background: '#E7F7D7' },
  lecture_report_deadline: { accent: '#F5CC00', background: '#FFF7CF' },
}

export function resolveCalendarEventColors(type: string): CalendarEventColor {
  if (type in CALENDAR_EVENT_COLORS) {
    return CALENDAR_EVENT_COLORS[type as CalendarScheduleEventKey]
  }
  return CALENDAR_EVENT_COLORS.education
}

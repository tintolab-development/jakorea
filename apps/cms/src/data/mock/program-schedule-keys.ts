/**
 * 프로그램 일정 위젯 kind·키 (가벼운 상수).
 * mock 교육 프로그램 풀을 끌어오지 않도록 ACL 해석과 분리.
 */

export type ProgramScheduleKind = 'general' | 'company_school' | 'ujat' | 'gemini'

export const PROGRAM_SCHEDULE_WIDGET_KEYS: Record<
  ProgramScheduleKind,
  | 'program-schedule-general-widget'
  | 'program-schedule-company-school-widget'
  | 'program-schedule-ujat-widget'
  | 'program-schedule-gemini-widget'
> = {
  general: 'program-schedule-general-widget',
  company_school: 'program-schedule-company-school-widget',
  ujat: 'program-schedule-ujat-widget',
  gemini: 'program-schedule-gemini-widget',
}

/**
 * 프로그램 일정 위젯 kind·키 (가벼운 상수).
 * mock 교육 프로그램 풀을 끌어오지 않도록 ACL 해석과 분리.
 */

export type ProgramScheduleKind = 'general' | 'company_school' | 'ujat' | 'gemini'

export const PROGRAM_SCHEDULE_KIND_ORDER: readonly ProgramScheduleKind[] = [
  'general',
  'company_school',
  'ujat',
  'gemini',
]

const ASSIGNED_PROGRAM_TYPE_ALIASES: Record<string, ProgramScheduleKind> = {
  general: 'general',
  education: 'general',
  company_school: 'company_school',
  company_school_program: 'company_school',
  economy: 'company_school',
  '1c1s': 'company_school',
  ujat: 'ujat',
  gemini: 'gemini',
}

/**
 * Me preferences `assignedProgramTypes` → 일정 위젯 kind.
 * `undefined`/`null`(필드 없음)은 ACL 폴백을 위해 null.
 * 빈 배열은 담당 유형 없음(일정 위젯 숨김).
 */
export function parseAssignedProgramTypes(
  raw: readonly string[] | null | undefined
): ProgramScheduleKind[] | null {
  if (raw == null) return null
  const seen = new Set<ProgramScheduleKind>()
  for (const value of raw) {
    const key = value.trim().toLowerCase().replace(/-/g, '_')
    const kind = ASSIGNED_PROGRAM_TYPE_ALIASES[key]
    if (kind) seen.add(kind)
  }
  return PROGRAM_SCHEDULE_KIND_ORDER.filter(kind => seen.has(kind))
}

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

/**
 * 프로그램 일정 위젯 kind·키
 */

export type ProgramScheduleKind =
  | 'general'
  | 'company_school'
  | 'ujat'
  | 'gemini'
  | 'trained_teacher'

export const PROGRAM_SCHEDULE_KIND_ORDER: readonly ProgramScheduleKind[] = [
  'general',
  'company_school',
  'ujat',
  'gemini',
  'trained_teacher',
]

/**
 * kind → GET /api/admin/dashboard/program-schedules `programType`.
 * BE는 general | company_school | ujat | gemini 별칭 또는 canonical program_type을 받는다.
 * 교육받은 교사는 별칭이 없어 canonical `TRAINED_TEACHER`로 보낸다.
 */
export function programScheduleKindToApiProgramType(kind: ProgramScheduleKind): string {
  return kind === 'trained_teacher' ? 'TRAINED_TEACHER' : kind
}

/** 교육받은 교사는 별도 일정 위젯(일반 위젯은 BE `general` 필터가 TRAINED_TEACHER를 제외) */
const ASSIGNED_PROGRAM_TYPE_ALIASES: Record<string, ProgramScheduleKind> = {
  general: 'general',
  education: 'general',
  trained_teachers: 'trained_teacher',
  trained_teacher: 'trained_teacher',
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
  | 'program-schedule-trained-teacher-widget'
> = {
  general: 'program-schedule-general-widget',
  company_school: 'program-schedule-company-school-widget',
  ujat: 'program-schedule-ujat-widget',
  gemini: 'program-schedule-gemini-widget',
  trained_teacher: 'program-schedule-trained-teacher-widget',
}

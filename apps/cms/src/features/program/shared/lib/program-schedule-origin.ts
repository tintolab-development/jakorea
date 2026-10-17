/**
 * `ProgramScheduleResponse.scheduleOrigin` / `ProgramEducationSlotResponse.scheduleOrigin`
 * OpenAPI는 string (enum 미정의). BE Swagger 검토 메모·education-slots 계약 기준 상수만 사용.
 */

export const PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED = 'PROGRAM_DEFINED' as const
export const PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED =
  'APPLICATION_MATERIALIZED' as const
export const PROGRAM_SCHEDULE_ORIGIN_UNKNOWN = 'UNKNOWN' as const

export type ProgramScheduleOrigin =
  | typeof PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED
  | typeof PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED
  | typeof PROGRAM_SCHEDULE_ORIGIN_UNKNOWN
  | (string & {})

export function readProgramScheduleOrigin(schedule: unknown): string | null {
  if (schedule == null || typeof schedule !== 'object') return null
  const raw = (schedule as { scheduleOrigin?: unknown }).scheduleOrigin
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed || null
}

export function isApplicationMaterializedProgramSchedule(schedule: unknown): boolean {
  const origin = readProgramScheduleOrigin(schedule)?.toUpperCase()
  return origin === PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED
}

/** 레거시 `/schedules` 폴백 — 신청 materialize row 제외, PROGRAM_DEFINED 또는 origin 미지정만 */
export function isPlannedProgramScheduleForLegacySchedulesList(schedule: unknown): boolean {
  if (isApplicationMaterializedProgramSchedule(schedule)) return false
  const origin = readProgramScheduleOrigin(schedule)?.toUpperCase()
  if (origin == null) return true
  if (origin === PROGRAM_SCHEDULE_ORIGIN_UNKNOWN) return true
  return origin === PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED
}

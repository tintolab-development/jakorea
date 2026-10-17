import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

/** BE canonical education slot — OpenAPI 동기화 전 FE loose read SSOT */
export type ProgramScheduleRole =
  | 'PRE_EDUCATION'
  | 'EDUCATION'
  | 'CLOSING'
  | 'SESSION'
  | (string & {})

export type ProgramScheduleCanonicalFields = {
  educationSlotKey?: string | null
  scheduleRole?: ProgramScheduleRole | null
  scheduleStatus?: string | null
  publiclyVisible?: boolean | null
}

export type ProgramScheduleWithCanonicalFields = ProgramScheduleResponse &
  ProgramScheduleCanonicalFields

const PROGRAM_SCHEDULE_ROLE_SET = new Set<string>([
  'PRE_EDUCATION',
  'EDUCATION',
  'CLOSING',
  'SESSION',
])

function readNullableString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function readNullableBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value
  return null
}

/** GET /programs/{id}/schedules additive 필드 — codegen 미반영 시 loose read */
export function readProgramScheduleCanonicalFields(
  schedule: unknown
): ProgramScheduleCanonicalFields {
  if (schedule == null || typeof schedule !== 'object') {
    return {
      educationSlotKey: null,
      scheduleRole: null,
      scheduleStatus: null,
      publiclyVisible: null,
    }
  }
  const raw = schedule as Record<string, unknown>
  const educationSlotKey = readNullableString(raw.educationSlotKey)
  const scheduleRoleRaw = readNullableString(raw.scheduleRole)
  const scheduleRole =
    scheduleRoleRaw != null && PROGRAM_SCHEDULE_ROLE_SET.has(scheduleRoleRaw)
      ? (scheduleRoleRaw as ProgramScheduleRole)
      : scheduleRoleRaw
  return {
    educationSlotKey,
    scheduleRole,
    scheduleStatus: readNullableString(raw.scheduleStatus),
    publiclyVisible: readNullableBoolean(raw.publiclyVisible),
  }
}

export function mergeProgramScheduleCanonicalFields<T extends ProgramScheduleResponse>(
  schedule: T
): ProgramScheduleWithCanonicalFields {
  return { ...schedule, ...readProgramScheduleCanonicalFields(schedule) }
}

/** 목록 row key — slotKey 우선, 레거시는 schedule id */
export function resolveProgramScheduleListRowKey(
  schedule: Pick<ProgramScheduleResponse, 'id'> & ProgramScheduleCanonicalFields
): string | null {
  const slotKey = schedule.educationSlotKey?.trim()
  if (slotKey) return slotKey
  const id = schedule.id
  if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
    return String(Math.trunc(id))
  }
  return null
}

export function isLegacyProgramScheduleWithoutEducationSlotKey(
  schedule: unknown
): boolean {
  const { educationSlotKey, scheduleRole } = readProgramScheduleCanonicalFields(schedule)
  return educationSlotKey == null && scheduleRole == null
}

export const PROGRAM_SCHEDULE_ROLE_EDUCATION = 'EDUCATION' as const
export const PROGRAM_SCHEDULE_ROLE_SESSION = 'SESSION' as const

const ROLES_ALLOWED_FOR_NEW_EDUCATION_ASSIGNMENT = new Set<string>([
  PROGRAM_SCHEDULE_ROLE_EDUCATION,
  PROGRAM_SCHEDULE_ROLE_SESSION,
])

const ROLES_BLOCKED_FOR_NEW_EDUCATION_ASSIGNMENT = new Set<string>([
  'PRE_EDUCATION',
  'CLOSING',
])

export const PROGRAM_SCHEDULE_STATUS_ACTIVE = 'ACTIVE'

function normalizeScheduleStatus(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase() ?? ''
  return trimmed || null
}

/**
 * 신규 강사·봉사·SCHEDULE 바인딩 후보 — 레거시 scheduleRole=null 은 허용(서버가 최종 검증).
 * PRE_EDUCATION/CLOSING 및 명시적 비-ACTIVE는 제외.
 */
export function isProgramScheduleRoleAllowedForNewEducationAssignment(
  schedule: unknown
): boolean {
  const { scheduleRole } = readProgramScheduleCanonicalFields(schedule)
  if (scheduleRole == null) return true
  const normalized = String(scheduleRole).trim().toUpperCase()
  if (ROLES_BLOCKED_FOR_NEW_EDUCATION_ASSIGNMENT.has(normalized)) return false
  return ROLES_ALLOWED_FOR_NEW_EDUCATION_ASSIGNMENT.has(normalized)
}

export function isProgramScheduleStatusActiveForNewAssignment(schedule: unknown): boolean {
  const { scheduleStatus } = readProgramScheduleCanonicalFields(schedule)
  const normalized = normalizeScheduleStatus(scheduleStatus)
  if (normalized == null) return true
  return normalized === PROGRAM_SCHEDULE_STATUS_ACTIVE
}

export function isProgramScheduleCandidateForNewEducationAssignment(
  schedule: unknown
): boolean {
  return (
    isProgramScheduleRoleAllowedForNewEducationAssignment(schedule) &&
    isProgramScheduleStatusActiveForNewAssignment(schedule)
  )
}

export function filterProgramSchedulesForNewEducationAssignment<T>(
  schedules: ReadonlyArray<T>
): T[] {
  return schedules.filter(schedule => isProgramScheduleCandidateForNewEducationAssignment(schedule))
}

/** 물리 scheduleId — 승인·배정·출석·SCHEDULE 바인딩용 */
export function resolveProgramSchedulePhysicalId(schedule: unknown): number | null {
  if (schedule == null || typeof schedule !== 'object') return null
  const id = (schedule as { id?: unknown }).id
  if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) return null
  return Math.trunc(id)
}

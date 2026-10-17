import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'

export function parseOrganizationPreferredScheduleId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^line:/i.test(trimmed)) return null
    if (!/^\d+$/.test(trimmed)) return null
    const parsed = Number(trimmed)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function readNullableIsoDateTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function readNullableLabel(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return String(value).trim() || null
  const trimmed = value.trim()
  return trimmed || null
}

function readNullableRound(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function readUnresolvedReason(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/**
 * 승인에 쓸 수 있는 일정은 API의 `scheduleId`만 신뢰한다.
 * 공통정보 line:N 등 매칭하지 못한 일정은 `unresolvedReason`과 함께
 * `scheduleId: null`로 내려오므로, 파생·레거시 ID를 대신 전송하면 안 된다.
 */
export function normalizePreferredEducationScheduleEntry(
  entry: unknown
): PreferredEducationSchedule | null {
  if (!entry || typeof entry !== 'object') return null
  const raw = entry as Record<string, unknown>
  const scheduleId = parseOrganizationPreferredScheduleId(raw.scheduleId)

  const label = readNullableLabel(raw.label)
  const startAt = readNullableIsoDateTime(raw.startAt)
  const endAt = readNullableIsoDateTime(raw.endAt)
  const round = readNullableRound(raw.round)
  const unresolvedReason = readUnresolvedReason(raw.unresolvedReason)

  if (!scheduleId && !label && !startAt && !endAt && !unresolvedReason) return null

  return {
    ...(scheduleId != null ? { scheduleId } : { scheduleId: null }),
    ...(round != null ? { round } : {}),
    ...(startAt != null ? { startAt } : {}),
    ...(endAt != null ? { endAt } : {}),
    ...(label != null ? { label } : {}),
    ...(unresolvedReason != null ? { unresolvedReason } : {}),
  }
}

/** organization-applications list/detail additive — Orval 미반영 시 loose read */
export function readOrganizationApplicationPreferredEducationSchedules(
  dto: unknown
): PreferredEducationSchedule[] {
  if (!dto || typeof dto !== 'object') return []
  const raw = (dto as { preferredEducationSchedules?: unknown }).preferredEducationSchedules
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizePreferredEducationScheduleEntry)
    .filter((entry): entry is PreferredEducationSchedule => entry != null)
}

export function isCompanySchoolOrganizationApplication(dto: {
  programType?: string | null
}): boolean {
  const normalized = dto.programType?.trim().toUpperCase() ?? ''
  return normalized === 'COMPANY_SCHOOL' || normalized === 'ONE_COMPANY_ONE_SCHOOL'
}

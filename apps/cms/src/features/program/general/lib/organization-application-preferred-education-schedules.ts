import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'

/** organization-applications list/detail additive — Orval 미반영 시 loose read */
export function readOrganizationApplicationPreferredEducationSchedules(
  dto: unknown
): PreferredEducationSchedule[] {
  if (!dto || typeof dto !== 'object') return []
  const raw = (dto as { preferredEducationSchedules?: unknown }).preferredEducationSchedules
  if (!Array.isArray(raw)) return []
  return raw as PreferredEducationSchedule[]
}

export function isCompanySchoolOrganizationApplication(dto: {
  programType?: string | null
}): boolean {
  const normalized = dto.programType?.trim().toUpperCase() ?? ''
  return normalized === 'COMPANY_SCHOOL' || normalized === 'ONE_COMPANY_ONE_SCHOOL'
}

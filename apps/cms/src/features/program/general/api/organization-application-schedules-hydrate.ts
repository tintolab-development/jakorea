import type { QueryClient } from '@tanstack/react-query'
import { applyRequestedSchedulesToApplicantSchoolRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { ensureOrganizationRequestedSchedules } from '@/features/program/general/api/organization-requested-schedules-query'
import { resolveSessionCalendarDateKey } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-calendar-session'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

export function schoolRowNeedsScheduleHydration(row: ApplicantSchoolRow): boolean {
  const sessions = row.sessions ?? []
  if (sessions.length === 0) return true
  return !sessions.some(session => resolveSessionCalendarDateKey(session) != null)
}

export async function hydrateOrganizationApplicationSchedules(
  rows: ApplicantSchoolRow[],
  queryClient: QueryClient,
  options?: { companySchool?: boolean; applicationIds?: string[] }
): Promise<ApplicantSchoolRow[]> {
  const idFilter = options?.applicationIds?.length
    ? new Set(options.applicationIds.map(id => id.trim()).filter(Boolean))
    : null

  return Promise.all(
    rows.map(async row => {
      if (idFilter && !idFilter.has(row.id)) return row
      if (!schoolRowNeedsScheduleHydration(row)) return row
      const requested = await ensureOrganizationRequestedSchedules(queryClient, row.id)
      if (!requested?.length) return row
      return applyRequestedSchedulesToApplicantSchoolRow(row, requested, options)
    })
  )
}

export function mergeHydratedOrganizationRows(
  current: ApplicantSchoolRow[],
  hydrated: ApplicantSchoolRow[]
): ApplicantSchoolRow[] {
  const byId = new Map(hydrated.map(row => [row.id, row]))
  return current.map(row => byId.get(row.id) ?? row)
}

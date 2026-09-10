import { temporarilyRejectUjatOrganizationApplicationsRemote } from '@/features/program/general/api/programs-api-client'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function parseNumericResourceId(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export async function rejectUjatOrganizationApplicationsIfRemote(input: {
  programId?: string | number | null
  applicationIds: Array<string | number>
  reason: string
}): Promise<boolean> {
  const programId = parseNumericResourceId(input.programId)
  const applicationIds = input.applicationIds
    .map(parseNumericResourceId)
    .filter((id): id is number => id != null)
  if (
    !isRealApiModuleEnabled('ujatPrograms') ||
    programId == null ||
    applicationIds.length === 0
  ) {
    return false
  }
  await temporarilyRejectUjatOrganizationApplicationsRemote(programId, {
    applicationIds,
    reason: input.reason.trim() || 'CMS UJAT 신청기관 임시 반려',
  })
  return true
}

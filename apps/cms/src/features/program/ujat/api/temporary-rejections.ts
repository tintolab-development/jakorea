import { temporarilyRejectUjatOrganizationApplicationsRemote } from '@/features/program/general/api/programs-api-client'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/** OpenAPI에 임시 반려 취소 엔드포인트가 없다. FE에서 상태를 임의 복원하지 않는다. */
export const UJAT_TEMP_REJECT_CANCEL_API_UNAVAILABLE =
  '임시 반려 취소 API가 없어 평가 대기로 되돌리지 않았습니다.'

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
    reason: input.reason.trim(),
  })
  return true
}

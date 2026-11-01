import {
  cancelUjatOrganizationTemporaryRejectionsRemote,
  temporarilyRejectUjatOrganizationApplicationsRemote,
} from '@/features/program/general/api/programs-api-client'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function parseNumericResourceId(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

function resolveRemoteIds(input: {
  programId?: string | number | null
  applicationIds: Array<string | number>
}): { programId: number; applicationIds: number[] } | null {
  const programId = parseNumericResourceId(input.programId)
  const applicationIds = input.applicationIds
    .map(parseNumericResourceId)
    .filter((id): id is number => id != null)
  if (
    !isRealApiModuleEnabled('ujatPrograms') ||
    programId == null ||
    applicationIds.length === 0
  ) {
    return null
  }
  return { programId, applicationIds }
}

/** POST temporary-rejections — body는 applicationIds만 (reason/notify 미전송). */
export async function rejectUjatOrganizationApplicationsIfRemote(input: {
  programId?: string | number | null
  applicationIds: Array<string | number>
}): Promise<boolean> {
  const resolved = resolveRemoteIds(input)
  if (!resolved) return false
  await temporarilyRejectUjatOrganizationApplicationsRemote(resolved.programId, {
    applicationIds: resolved.applicationIds,
  })
  return true
}

/**
 * POST temporary-rejections:cancel — TEMP_REJECTED만.
 * 복원 상태는 서버(활성 슬롯 → TEMP_ASSIGNED, 없으면 EVALUATION_PENDING). FE가 추정하지 않는다.
 */
export async function cancelUjatOrganizationTemporaryRejectionsIfRemote(input: {
  programId?: string | number | null
  applicationIds: Array<string | number>
}): Promise<boolean> {
  const resolved = resolveRemoteIds(input)
  if (!resolved) return false
  await cancelUjatOrganizationTemporaryRejectionsRemote(resolved.programId, {
    applicationIds: resolved.applicationIds,
  })
  return true
}

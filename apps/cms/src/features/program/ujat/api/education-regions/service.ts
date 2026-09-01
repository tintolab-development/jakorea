import type {
  UjatEducationRegion,
  UjatEducationRegionCreateInput,
  UjatEducationRegionUpdateInput,
} from '@/features/program/ujat/model/education-region.types'
import {
  createUjatEducationRegion as createLocal,
  deleteUjatEducationRegion as deleteLocal,
  readUjatEducationRegions,
  reorderUjatEducationRegions as reorderLocal,
  updateUjatEducationRegion as updateLocal,
} from '@/features/program/ujat/lib/education-region-store'
import {
  assertUjatEducationRegionNameAvailable,
  normalizeUjatEducationRegionName,
  UjatEducationRegionDuplicateNameError,
} from '@/features/program/ujat/lib/education-region-name'
import {
  mapEducationRegionResponse,
  mapEducationRegionReorderRequest,
  mapEducationRegionUpdateRequest,
  normalizeEducationRegionSort,
} from './adapters'
import { shouldUseUjatEducationRegionsRemoteApi } from './capabilities'
import {
  createAdminUjatEducationRegionRemote,
  deleteAdminUjatEducationRegionRemote,
  fetchAdminUjatEducationRegionsRemote,
  patchAdminUjatEducationRegionRemote,
  reorderAdminUjatEducationRegionsRemote,
} from './client'

/** remote list 스냅샷 — React 밖 소비처(신청 탭 등)용 */
let remoteSnapshot: UjatEducationRegion[] | null = null

export function getUjatEducationRegionsRemoteSnapshot(): UjatEducationRegion[] | null {
  return remoteSnapshot
}

export function setUjatEducationRegionsRemoteSnapshot(
  items: UjatEducationRegion[] | null
): void {
  remoteSnapshot = items
}

export async function listUjatEducationRegionsService(): Promise<UjatEducationRegion[]> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    const local = readUjatEducationRegions()
    setUjatEducationRegionsRemoteSnapshot(null)
    return local
  }
  const items = normalizeEducationRegionSort(
    (await fetchAdminUjatEducationRegionsRemote()).map(mapEducationRegionResponse)
  )
  setUjatEducationRegionsRemoteSnapshot(items)
  return items
}

async function resolveRegionsForNameCheck(): Promise<UjatEducationRegion[]> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return readUjatEducationRegions()
  }
  if (remoteSnapshot) return remoteSnapshot
  return listUjatEducationRegionsService()
}

function rethrowDuplicateNameFromRemote(error: unknown): never {
  const status =
    error != null &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status
  if (status === 409) throw new UjatEducationRegionDuplicateNameError()
  throw error
}

export async function createUjatEducationRegionService(
  input: UjatEducationRegionCreateInput
): Promise<UjatEducationRegion> {
  const name = normalizeUjatEducationRegionName(input.name)
  const regions = await resolveRegionsForNameCheck()
  assertUjatEducationRegionNameAvailable(regions, name)

  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return createLocal({ ...input, name })
  }
  try {
    const dto = await createAdminUjatEducationRegionRemote({
      nameKo: name,
      displayName: name,
      activeYn: input.active,
      code: `custom_${Date.now()}`,
    })
    const mapped = mapEducationRegionResponse(dto)
    const next = normalizeEducationRegionSort([...(remoteSnapshot ?? []), mapped])
    setUjatEducationRegionsRemoteSnapshot(next)
    return mapped
  } catch (error) {
    rethrowDuplicateNameFromRemote(error)
  }
}

export async function updateUjatEducationRegionService(
  id: string,
  patch: UjatEducationRegionUpdateInput
): Promise<UjatEducationRegion> {
  if (patch.name !== undefined) {
    const regions = await resolveRegionsForNameCheck()
    assertUjatEducationRegionNameAvailable(regions, patch.name, { excludeId: id })
  }

  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    const updated = updateLocal(id, patch)
    if (!updated) throw new Error('교육 지역을 찾을 수 없습니다.')
    return updated
  }
  try {
    const dto = await patchAdminUjatEducationRegionRemote(
      id,
      mapEducationRegionUpdateRequest(patch)
    )
    return mapEducationRegionResponse(dto)
  } catch (error) {
    rethrowDuplicateNameFromRemote(error)
  }
}

export async function deleteUjatEducationRegionService(
  id: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'has_usage' | 'remote_error' }> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return deleteLocal(id)
  }
  try {
    await deleteAdminUjatEducationRegionRemote(id)
    if (remoteSnapshot) {
      setUjatEducationRegionsRemoteSnapshot(remoteSnapshot.filter(row => row.id !== id))
    }
    return { ok: true }
  } catch (error) {
    const status =
      error != null &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status
    if (status === 409) return { ok: false, reason: 'has_usage' }
    if (status === 404) return { ok: false, reason: 'not_found' }
    return { ok: false, reason: 'remote_error' }
  }
}

export async function reorderUjatEducationRegionsService(
  orderedIds: string[]
): Promise<UjatEducationRegion[]> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return reorderLocal(orderedIds)
  }
  const current = remoteSnapshot ?? (await listUjatEducationRegionsService())
  const byId = new Map(current.map(row => [row.id, row]))
  const ordered = orderedIds
    .map(id => byId.get(id))
    .filter((row): row is UjatEducationRegion => Boolean(row))
  const missing = current.filter(row => !orderedIds.includes(row.id))
  const next = normalizeEducationRegionSort([...ordered, ...missing])
  await reorderAdminUjatEducationRegionsRemote(mapEducationRegionReorderRequest(next))
  setUjatEducationRegionsRemoteSnapshot(next)
  return next
}

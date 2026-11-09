import type {
  UjatEducationRegion,
  UjatEducationRegionCreateInput,
  UjatEducationRegionFilters,
  UjatEducationRegionUpdateInput,
} from '@/features/program/ujat/model/education-region.types'
import { filterUjatEducationRegions } from '@/features/program/ujat/lib/education-region-filter'
import {
  createUjatEducationRegion as createLocal,
  clearUjatEducationRegionsLocalStorage,
  deleteUjatEducationRegion as deleteLocal,
  readActiveUjatEducationRegionsOrdered,
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
  // remote SSOT — 레거시 localStorage 키는 list 진입 시점에 제거 (성공 전에도 쓰지 않음)
  clearUjatEducationRegionsLocalStorage()
  const items = normalizeEducationRegionSort(
    (await fetchAdminUjatEducationRegionsRemote()).map(mapEducationRegionResponse)
  )
  setUjatEducationRegionsRemoteSnapshot(items)
  return items
}

/** 탭·필터용 — GET ?activeYn=true, displayOrder ASC */
export async function listUjatEducationRegionsActiveRemoteService(): Promise<
  UjatEducationRegion[]
> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return readActiveUjatEducationRegionsOrdered()
  }
  clearUjatEducationRegionsLocalStorage()
  const items = normalizeEducationRegionSort(
    (
      await fetchAdminUjatEducationRegionsRemote({
        activeYn: true,
        includeInactive: false,
      })
    )
      .map(mapEducationRegionResponse)
      .filter(row => row.regionKey.trim() && row.active)
  )
  const snapshot = getUjatEducationRegionsRemoteSnapshot()
  if (!snapshot) {
    setUjatEducationRegionsRemoteSnapshot(items)
  } else {
    const inactive = snapshot.filter(row => !row.active)
    setUjatEducationRegionsRemoteSnapshot(normalizeEducationRegionSort([...items, ...inactive]))
  }
  return items
}

/**
 * 교육 지역 관리 테이블 조회 — 필터를 GET 쿼리로 전달.
 * 백엔드는 현재 `includeInactive`만 지원하므로 응답에 동일 필터를 한 번 더 적용한다.
 * 전역 스냅샷(전체 목록)은 갱신하지 않는다.
 */
export async function listUjatEducationRegionsFilteredService(
  filters: UjatEducationRegionFilters
): Promise<UjatEducationRegion[]> {
  if (!shouldUseUjatEducationRegionsRemoteApi()) {
    return filterUjatEducationRegions(readUjatEducationRegions(), filters)
  }
  const keyword = filters.name.trim()
  const items = normalizeEducationRegionSort(
    (
      await fetchAdminUjatEducationRegionsRemote({
        includeInactive: filters.usageStatus !== 'active',
        activeYn: filters.usageStatus === 'all' ? undefined : filters.usageStatus === 'active',
        keyword: keyword || undefined,
      })
    ).map(mapEducationRegionResponse)
  )
  return filterUjatEducationRegions(items, filters)
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
    const mapped = mapEducationRegionResponse(dto)
    if (remoteSnapshot) {
      setUjatEducationRegionsRemoteSnapshot(
        normalizeEducationRegionSort(
          remoteSnapshot.map(row => (row.id === mapped.id ? mapped : row))
        )
      )
    }
    return mapped
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
  return listUjatEducationRegionsService()
}

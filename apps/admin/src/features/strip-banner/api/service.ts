import type {
  StripBanner,
  StripBannerCreateInput,
  StripBannerListFilter,
  StripBannerUpdateInput,
} from '@/entities/strip-banner/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import { shouldUseStripBannerRemoteApi } from './capabilities'
import {
  mapStripResponseToDomain,
  toBulkDeleteRequest,
  toReorderRequest,
  toStripCreateRequest,
  toStripListParams,
  toStripUpdateRequest,
  toToggleRequest,
} from './mappers'
import {
  createStripBanner as createLocal,
  readStripBanners,
  removeStripBanners as removeLocal,
  reorderStripBanners as reorderLocal,
  setStripBannerActive as setActiveLocal,
  updateStripBanner as updateLocal,
} from './store'

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function listRemoteStripBanners(filter?: StripBannerListFilter): Promise<StripBanner[]> {
  const response = await mainApi().list3(toStripListParams(filter))
  return (response.items ?? []).map(mapStripResponseToDomain)
}

async function resolveCurrentRows(cachedRows?: StripBanner[]): Promise<StripBanner[]> {
  if (cachedRows && cachedRows.length > 0) {
    return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemoteStripBanners()
}

export async function listStripBannersService(
  filter?: StripBannerListFilter,
): Promise<StripBanner[]> {
  if (shouldUseStripBannerRemoteApi()) {
    return listRemoteStripBanners(filter)
  }
  return readStripBanners(filter)
}

export async function createStripBannerService(
  input: StripBannerCreateInput,
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    const created = await mainApi().create2(toStripCreateRequest(input))
    return mapStripResponseToDomain(created)
  }
  return createLocal(input)
}

export async function updateStripBannerService(
  id: string,
  patch: StripBannerUpdateInput,
  cachedRows?: StripBanner[],
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`StripBanner not found: ${id}`)
    }
    const updated = await mainApi().update4(Number(id), toStripUpdateRequest(current, patch))
    return mapStripResponseToDomain(updated)
  }
  return updateLocal(id, patch)
}

export async function removeStripBannersService(
  ids: string[],
  cachedRows?: StripBanner[],
): Promise<void> {
  if (shouldUseStripBannerRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const rows = (await resolveCurrentRows(cachedRows)).filter(row => idSet.has(row.id))
    if (rows.length === 0) return
    await mainApi().bulkDelete(toBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function reorderStripBannersService(
  orderedIds: string[],
  cachedRows?: StripBanner[],
): Promise<StripBanner[]> {
  if (shouldUseStripBannerRemoteApi()) {
    const byId = new Map((await resolveCurrentRows(cachedRows)).map(row => [row.id, row]))
    const ordered: StripBanner[] = []
    for (const id of orderedIds) {
      const row = byId.get(id)
      if (row) {
        ordered.push(row)
        byId.delete(id)
      }
    }
    for (const row of byId.values()) {
      ordered.push(row)
    }
    const updated = await mainApi().reorder(toReorderRequest(ordered))
    return updated.map(mapStripResponseToDomain)
  }
  return reorderLocal(orderedIds)
}

export async function setStripBannerActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: StripBanner[],
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`StripBanner not found: ${id}`)
    }
    const updated = await mainApi().toggle1(Number(id), toToggleRequest(current, isActive))
    return mapStripResponseToDomain(updated)
  }
  return setActiveLocal(id, isActive)
}

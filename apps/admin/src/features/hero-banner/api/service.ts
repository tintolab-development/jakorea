import type {
  HeroBanner,
  HeroBannerCreateInput,
  HeroBannerUpdateInput,
} from '@/entities/hero-banner/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import { shouldUseHeroBannerRemoteApi } from './capabilities'
import {
  mapHeroResponseToDomain,
  toBulkDeleteRequest,
  toHeroCreateRequest,
  toHeroUpdateRequest,
  toReorderRequest,
  toToggleRequest,
} from './mappers'
import {
  createHeroBanner as createLocal,
  readHeroBanners,
  removeHeroBanners as removeLocal,
  reorderHeroBanners as reorderLocal,
  setHeroBannerActive as setActiveLocal,
  updateHeroBanner as updateLocal,
} from './store'
import { uploadHeroImageAsset } from './upload-hero-image'

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function listRemoteHeroBanners(): Promise<HeroBanner[]> {
  const response = await mainApi().list5()
  return (response.items ?? []).map(mapHeroResponseToDomain)
}

/** 캐시 우선 — 없으면 list GET 1회 */
async function resolveCurrentRows(cachedRows?: HeroBanner[]): Promise<HeroBanner[]> {
  if (cachedRows && cachedRows.length > 0) {
    return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemoteHeroBanners()
}

async function resolveImageAssetIdForCreate(input: HeroBannerCreateInput): Promise<number> {
  if (input.imageFile) {
    return uploadHeroImageAsset(input.imageFile)
  }
  if (input.imageAssetId != null) {
    return input.imageAssetId
  }
  throw new Error('배너 이미지를 등록해 주세요.')
}

async function resolveImageAssetIdForUpdate(
  current: HeroBanner,
  patch: HeroBannerUpdateInput,
): Promise<number> {
  if (patch.imageFile) {
    return uploadHeroImageAsset(patch.imageFile)
  }
  if (patch.imageAssetId != null) {
    return patch.imageAssetId
  }
  if (current.imageAssetId != null) {
    return current.imageAssetId
  }
  throw new Error('배너 이미지 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function listHeroBannersService(): Promise<HeroBanner[]> {
  if (shouldUseHeroBannerRemoteApi()) {
    return listRemoteHeroBanners()
  }
  return readHeroBanners()
}

export async function createHeroBannerService(
  input: HeroBannerCreateInput,
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    const imageAssetId = await resolveImageAssetIdForCreate(input)
    const created = await mainApi().create4(toHeroCreateRequest(input, imageAssetId))
    return mapHeroResponseToDomain(created)
  }
  return createLocal(input)
}

export async function updateHeroBannerService(
  id: string,
  patch: HeroBannerUpdateInput,
  cachedRows?: HeroBanner[],
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`HeroBanner not found: ${id}`)
    }
    const imageAssetId = await resolveImageAssetIdForUpdate(current, patch)
    const updated = await mainApi().update7(
      Number(id),
      toHeroUpdateRequest(current, patch, imageAssetId),
    )
    return mapHeroResponseToDomain(updated)
  }
  return updateLocal(id, patch)
}

export async function removeHeroBannersService(
  ids: string[],
  cachedRows?: HeroBanner[],
): Promise<void> {
  if (shouldUseHeroBannerRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const rows = (await resolveCurrentRows(cachedRows)).filter(row => idSet.has(row.id))
    if (rows.length === 0) return
    await mainApi().bulkDelete2(toBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function reorderHeroBannersService(
  orderedIds: string[],
  cachedRows?: HeroBanner[],
): Promise<HeroBanner[]> {
  if (shouldUseHeroBannerRemoteApi()) {
    const byId = new Map((await resolveCurrentRows(cachedRows)).map(row => [row.id, row]))
    const ordered: HeroBanner[] = []
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
    const updated = await mainApi().reorder2(toReorderRequest(ordered))
    return updated.map(mapHeroResponseToDomain)
  }
  return reorderLocal(orderedIds)
}

export async function setHeroBannerActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: HeroBanner[],
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`HeroBanner not found: ${id}`)
    }
    const updated = await mainApi().toggle3(Number(id), toToggleRequest(current, isActive))
    return mapHeroResponseToDomain(updated)
  }
  return setActiveLocal(id, isActive)
}

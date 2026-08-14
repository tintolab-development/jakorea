import type {
  Popup,
  PopupCreateInput,
  PopupListFilter,
  PopupUpdateInput,
} from '@/entities/popup/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import { shouldUsePopupRemoteApi } from './capabilities'
import {
  applyClientAltTextFilter,
  mapPopupResponseToDomain,
  toBulkDeleteRequest,
  toPopupCreateRequest,
  toPopupListParams,
  toPopupUpdateRequest,
  toReorderRequest,
  toToggleRequest,
} from './mappers'
import {
  createPopup as createLocal,
  readPopups,
  removePopups as removeLocal,
  reorderPopups as reorderLocal,
  setPopupActive as setActiveLocal,
  updatePopup as updateLocal,
} from './store'
import { uploadPopupImageAsset } from './upload-popup-image'

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function listRemotePopups(filter?: PopupListFilter): Promise<Popup[]> {
  const response = await mainApi().list4(toPopupListParams(filter))
  const rows = (response.items ?? []).map(mapPopupResponseToDomain)
  return applyClientAltTextFilter(rows, filter)
}

async function resolveCurrentRows(cachedRows?: Popup[]): Promise<Popup[]> {
  if (cachedRows && cachedRows.length > 0) {
    return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemotePopups()
}

async function resolveImageAssetIdForCreate(input: PopupCreateInput): Promise<number> {
  if (input.imageFile) {
    return uploadPopupImageAsset(input.imageFile)
  }
  if (input.imageAssetId != null) {
    return input.imageAssetId
  }
  throw new Error('팝업 이미지를 등록해 주세요.')
}

async function resolveImageAssetIdForUpdate(
  current: Popup,
  patch: PopupUpdateInput,
): Promise<number> {
  if (patch.imageFile) {
    return uploadPopupImageAsset(patch.imageFile)
  }
  if (patch.imageAssetId != null) {
    return patch.imageAssetId
  }
  if (current.imageAssetId != null) {
    return current.imageAssetId
  }
  throw new Error('팝업 이미지 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function listPopupsService(filter?: PopupListFilter): Promise<Popup[]> {
  if (shouldUsePopupRemoteApi()) {
    return listRemotePopups(filter)
  }
  return readPopups(filter)
}

export async function createPopupService(input: PopupCreateInput): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    const imageAssetId = await resolveImageAssetIdForCreate(input)
    const created = await mainApi().create3(toPopupCreateRequest(input, imageAssetId))
    return mapPopupResponseToDomain(created)
  }
  return createLocal(input)
}

export async function updatePopupService(
  id: string,
  patch: PopupUpdateInput,
  cachedRows?: Popup[],
): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`Popup not found: ${id}`)
    }
    const imageAssetId = await resolveImageAssetIdForUpdate(current, patch)
    const updated = await mainApi().update6(
      Number(id),
      toPopupUpdateRequest(current, patch, imageAssetId),
    )
    return mapPopupResponseToDomain(updated)
  }
  return updateLocal(id, patch)
}

export async function removePopupsService(
  ids: string[],
  cachedRows?: Popup[],
): Promise<void> {
  if (shouldUsePopupRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const rows = (await resolveCurrentRows(cachedRows)).filter(row => idSet.has(row.id))
    if (rows.length === 0) return
    await mainApi().bulkDelete1(toBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function reorderPopupsService(
  orderedIds: string[],
  cachedRows?: Popup[],
): Promise<Popup[]> {
  if (shouldUsePopupRemoteApi()) {
    const byId = new Map((await resolveCurrentRows(cachedRows)).map(row => [row.id, row]))
    const ordered: Popup[] = []
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
    const updated = await mainApi().reorder1(toReorderRequest(ordered))
    return updated.map(mapPopupResponseToDomain)
  }
  return reorderLocal(orderedIds)
}

export async function setPopupActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: Popup[],
): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    const rows = await resolveCurrentRows(cachedRows)
    const current = rows.find(row => row.id === id)
    if (!current) {
      throw new Error(`Popup not found: ${id}`)
    }
    const updated = await mainApi().toggle2(Number(id), toToggleRequest(current, isActive))
    return mapPopupResponseToDomain(updated)
  }
  return setActiveLocal(id, isActive)
}

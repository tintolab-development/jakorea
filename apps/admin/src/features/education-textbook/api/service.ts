import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import { shouldUseEducationTextbookRemoteApi } from './capabilities'
import {
  mapTextbookListItemToDomain,
  mapTextbookResponseToDomain,
  toEnabledToggleRequest,
  toTextbookBulkDeleteRequest,
  toTextbookCreateRequest,
  toTextbookListParams,
  toTextbookUpdateRequest,
} from './mappers'
import {
  createEducationTextbook as createLocal,
  getEducationTextbook as getLocal,
  readEducationTextbooks,
  removeEducationTextbooks as removeLocal,
  setEducationTextbookActive as setActiveLocal,
  updateEducationTextbook as updateLocal,
} from './store'
import { uploadEducationTextbookThumbnailAsset } from './upload-textbook-thumbnail'

function educationApi() {
  return getJAKoreaHomepageAdminAPIEducationSubset()
}

async function listRemote(
  filter?: EducationTextbookListFilter,
): Promise<EducationTextbook[]> {
  const response = await educationApi().list9(toTextbookListParams(filter))
  return (response.items ?? []).map(mapTextbookListItemToDomain)
}

async function resolveThumbnailAssetId(
  input: EducationTextbookCreateInput,
  fallbackAssetId?: number,
): Promise<number | undefined> {
  if (input.thumbnailFile instanceof File) {
    return uploadEducationTextbookThumbnailAsset(input.thumbnailFile)
  }
  if (input.thumbnailAssetId != null && input.thumbnailAssetId > 0) {
    return input.thumbnailAssetId
  }
  return fallbackAssetId
}

export async function listEducationTextbooksService(
  filter: EducationTextbookListFilter = {},
): Promise<EducationTextbook[]> {
  if (shouldUseEducationTextbookRemoteApi()) {
    return listRemote(filter)
  }
  return readEducationTextbooks(filter)
}

export async function getEducationTextbookService(
  id: string,
): Promise<EducationTextbook | null> {
  if (shouldUseEducationTextbookRemoteApi()) {
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) return null
    try {
      const row = await educationApi().detail2(numericId)
      return mapTextbookResponseToDomain(row)
    } catch {
      return null
    }
  }
  return getLocal(id)
}

export async function createEducationTextbookService(
  input: EducationTextbookCreateInput,
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    const thumbnailAssetId = await resolveThumbnailAssetId(input)
    const created = await educationApi().create8(
      toTextbookCreateRequest(input, thumbnailAssetId),
    )
    return mapTextbookResponseToDomain(created)
  }
  return createLocal(input)
}

export async function updateEducationTextbookService(
  input: EducationTextbookUpdateInput,
  cached?: EducationTextbook | null,
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    const current =
      cached && cached.id === input.id ? cached : await getEducationTextbookService(input.id)
    if (!current) throw new Error(`Education textbook not found: ${input.id}`)
    const thumbnailAssetId = await resolveThumbnailAssetId(
      input,
      current.thumbnailAssetId,
    )
    const updated = await educationApi().update12(
      Number(input.id),
      toTextbookUpdateRequest(input, current.version ?? 0, thumbnailAssetId),
    )
    return mapTextbookResponseToDomain(updated)
  }
  return updateLocal(input)
}

export async function removeEducationTextbooksService(
  ids: string[],
  cachedList?: EducationTextbook[],
): Promise<void> {
  if (shouldUseEducationTextbookRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const rows = (cachedList ?? []).filter(row => idSet.has(row.id))
    if (rows.length < ids.length) {
      const have = new Set(rows.map(r => r.id))
      for (const id of ids) {
        if (have.has(id)) continue
        const detail = await getEducationTextbookService(id)
        if (detail) rows.push(detail)
      }
    }
    if (rows.length === 0) return
    await educationApi().bulkDelete5(toTextbookBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function setEducationTextbookActiveService(
  id: string,
  isActive: boolean,
  cached?: EducationTextbook | null,
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    const current =
      cached && cached.id === id ? cached : await getEducationTextbookService(id)
    if (!current) throw new Error(`Education textbook not found: ${id}`)
    const updated = await educationApi().toggle4(
      Number(id),
      toEnabledToggleRequest(current, isActive),
    )
    return mapTextbookResponseToDomain(updated)
  }
  return setActiveLocal(id, isActive)
}

import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import {
  mapTextbookListItemToDomain,
  mapTextbookResponseToDomain,
  toEnabledToggleRequest,
  toTextbookBulkDeleteRequest,
  toTextbookCreateRequest,
  toTextbookListParams,
  toTextbookUpdateRequest,
} from './mappers'
import { uploadEducationTextbookThumbnailAsset } from './upload-textbook-thumbnail'

function educationApi() {
  return getJAKoreaHomepageAdminAPIEducationSubset()
}

async function listRemotePage(
  filter: EducationTextbookListFilter | undefined,
  page: number,
): Promise<AdminListPage<EducationTextbook>> {
  const response = await educationApi().list8(toTextbookListParams(filter, page))
  return toAdminListPage(
    (response.items ?? []).map(mapTextbookListItemToDomain),
    page,
    response,
  )
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

export async function listEducationTextbooksPageService(
  filter: EducationTextbookListFilter = {},
  page = 0,
): Promise<AdminListPage<EducationTextbook>> {
  return listRemotePage(filter, page)
}

export async function getEducationTextbookService(
  id: string,
): Promise<EducationTextbook | null> {
  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) return null
  try {
    const row = await educationApi().detail2(numericId)
    return mapTextbookResponseToDomain(row)
  } catch {
    return null
  }
}

export async function createEducationTextbookService(
  input: EducationTextbookCreateInput,
): Promise<EducationTextbook> {
  const thumbnailAssetId = await resolveThumbnailAssetId(input)
  const created = await educationApi().create10(toTextbookCreateRequest(input, thumbnailAssetId))
  return mapTextbookResponseToDomain(created)
}

export async function updateEducationTextbookService(
  input: EducationTextbookUpdateInput,
  cached?: EducationTextbook | null,
): Promise<EducationTextbook> {
  const current =
    cached && cached.id === input.id ? cached : await getEducationTextbookService(input.id)
  if (!current) throw new Error(`Education textbook not found: ${input.id}`)
  const thumbnailAssetId = await resolveThumbnailAssetId(input, current.thumbnailAssetId)
  const updated = await educationApi().update12(
    Number(input.id),
    toTextbookUpdateRequest(input, current.version ?? 0, thumbnailAssetId),
  )
  return mapTextbookResponseToDomain(updated)
}

export async function removeEducationTextbooksService(
  ids: string[],
  cachedList?: EducationTextbook[],
): Promise<void> {
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
}

export async function setEducationTextbookActiveService(
  id: string,
  isActive: boolean,
  cached?: EducationTextbook | null,
): Promise<EducationTextbook> {
  const current = cached && cached.id === id ? cached : await getEducationTextbookService(id)
  if (!current) throw new Error(`Education textbook not found: ${id}`)
  const updated = await educationApi().toggle4(Number(id), toEnabledToggleRequest(current, isActive))
  return mapTextbookResponseToDomain(updated)
}

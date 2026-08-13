import type {
  ImpactStory,
  ImpactStoryAttachment,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import { getJAKoreaHomepageAdminAPIImpactStorySubset } from '@/shared/api/generated/impact-story/impact-story-api'
import { PinLimitError } from '@/features/impact-stories/lib/pin-limits'
import {
  shouldUseImpactStoryCategoriesRemoteApi,
  shouldUseImpactStoriesRemoteApi,
} from './capabilities'
import {
  isPersistedCategoryId,
  mapCategoryResponseToDomain,
  mapStoryListItemToDomain,
  mapStoryResponseToDomain,
  resolvePrimaryAttachmentAssetId,
  toBulkDeleteRequest,
  toCategoryCreateRequest,
  toCategoryUpdateRequest,
  toPublishedToggleRequest,
  toStoryCreateRequest,
  toStoryListParams,
  toStoryUpdateRequest,
} from './mappers'
import {
  countPinnedStories as countPinnedLocal,
  createStory as createLocal,
  getStoryById,
  readCategories,
  readStories,
  removeStories as removeLocal,
  saveCategories as saveCategoriesLocal,
  setStoryPublic as setPublicLocal,
  updateStory as updateLocal,
} from './store'
import { uploadImpactStoryAttachmentAsset } from './upload-story-attachment'

function impactStoryApi() {
  return getJAKoreaHomepageAdminAPIImpactStorySubset()
}

async function listRemoteCategories(): Promise<ImpactStoryCategory[]> {
  const rows = await impactStoryApi().list8()
  return (rows ?? []).map((row, i) => mapCategoryResponseToDomain(row, i))
}

async function saveCategoriesRemote(
  items: ImpactStoryCategory[],
  cached?: ImpactStoryCategory[] | null,
): Promise<ImpactStoryCategory[]> {
  const api = impactStoryApi()
  const current =
    cached && cached.length > 0 ? cached : await listRemoteCategories()
  const currentById = new Map(current.map(row => [row.id, row]))
  const draftIds = new Set(items.map(row => row.id))

  for (const row of current) {
    if (draftIds.has(row.id)) continue
    await api._delete(Number(row.id), { version: row.version ?? 0 })
  }

  const result: ImpactStoryCategory[] = []
  let sortOrder = 0
  for (const item of items) {
    const name = item.name.trim()
    if (!name) continue

    const existing = currentById.get(item.id)
    if (existing && isPersistedCategoryId(item.id)) {
      if (existing.name.trim() === name) {
        result.push({ ...existing, name, sortOrder: sortOrder++ })
        continue
      }
      const updated = await api.update11(
        Number(item.id),
        toCategoryUpdateRequest(name, existing.version ?? 0),
      )
      result.push(mapCategoryResponseToDomain(updated, sortOrder++))
      continue
    }

    const created = await api.create7(toCategoryCreateRequest(name))
    result.push(mapCategoryResponseToDomain(created, sortOrder++))
  }

  return result
}

async function listRemoteStories(filter?: ImpactStoryListFilter): Promise<ImpactStory[]> {
  const response = await impactStoryApi().list7(toStoryListParams(filter))
  return (response.items ?? []).map(mapStoryListItemToDomain)
}

async function resolveAttachmentAssetId(
  attachments: ImpactStoryAttachment[],
  fallbackAssetId?: number,
): Promise<number | undefined> {
  const withFile = attachments.find(att => att.file instanceof File)
  if (withFile?.file) {
    return uploadImpactStoryAttachmentAsset(withFile.file)
  }
  const fromExisting = resolvePrimaryAttachmentAssetId(attachments)
  if (fromExisting != null) return fromExisting
  return fallbackAssetId
}

function isPinLimitApiError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { response?: { data?: { code?: string } }; code?: string }
  const code = e.response?.data?.code ?? e.code
  return code === 'IMPACT_PIN_LIMIT_EXCEEDED'
}

export async function listCategoriesService(): Promise<ImpactStoryCategory[]> {
  if (shouldUseImpactStoryCategoriesRemoteApi()) {
    return listRemoteCategories()
  }
  return readCategories()
}

export async function saveCategoriesService(
  items: ImpactStoryCategory[],
  cached?: ImpactStoryCategory[] | null,
): Promise<ImpactStoryCategory[]> {
  if (shouldUseImpactStoryCategoriesRemoteApi()) {
    return saveCategoriesRemote(items, cached)
  }
  return saveCategoriesLocal(items)
}

export async function listStoriesService(
  filter?: ImpactStoryListFilter,
): Promise<ImpactStory[]> {
  if (shouldUseImpactStoriesRemoteApi()) {
    return listRemoteStories(filter)
  }
  return readStories(filter)
}

export async function getStoryService(id: string): Promise<ImpactStory | null> {
  if (shouldUseImpactStoriesRemoteApi()) {
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) return null
    try {
      const row = await impactStoryApi().detail1(numericId)
      return mapStoryResponseToDomain(row)
    } catch {
      return null
    }
  }
  return getStoryById(id)
}

export async function createStoryService(
  input: ImpactStoryCreateInput,
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    try {
      const attachmentAssetId = await resolveAttachmentAssetId(input.attachments)
      const created = await impactStoryApi().create6(
        toStoryCreateRequest(input, attachmentAssetId),
      )
      return mapStoryResponseToDomain(created)
    } catch (error) {
      if (isPinLimitApiError(error)) throw new PinLimitError()
      throw error
    }
  }
  return createLocal(input)
}

export async function updateStoryService(
  input: ImpactStoryUpdateInput,
  cached?: ImpactStory | null,
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    const current =
      cached && cached.id === input.id ? cached : await getStoryService(input.id)
    if (!current) {
      throw new Error(`Impact story not found: ${input.id}`)
    }
    try {
      const attachmentAssetId = await resolveAttachmentAssetId(
        input.attachments,
        current.attachments[0]?.assetId,
      )
      const updated = await impactStoryApi().update10(
        Number(input.id),
        toStoryUpdateRequest(input, current.version ?? 0, attachmentAssetId),
      )
      return mapStoryResponseToDomain(updated)
    } catch (error) {
      if (isPinLimitApiError(error)) throw new PinLimitError()
      throw error
    }
  }
  return updateLocal(input)
}

export async function removeStoriesService(
  ids: string[],
  cachedList?: ImpactStory[],
): Promise<void> {
  if (shouldUseImpactStoriesRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    let rows = (cachedList ?? []).filter(row => idSet.has(row.id))
    if (rows.length === 0) {
      const all = await listRemoteStories()
      rows = all.filter(row => idSet.has(row.id))
    }
    // 캐시에 없는 선택 행은 detail로 version 확보 (size 부풀리기 금지)
    if (rows.length < ids.length) {
      const have = new Set(rows.map(r => r.id))
      for (const id of ids) {
        if (have.has(id)) continue
        const detail = await getStoryService(id)
        if (detail) rows.push(detail)
      }
    }
    if (rows.length === 0) return
    await impactStoryApi().bulkDelete4(toBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function setStoryPublicService(
  id: string,
  isPublic: boolean,
  cached?: ImpactStory | null,
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    const current = cached && cached.id === id ? cached : await getStoryService(id)
    if (!current) {
      throw new Error(`Impact story not found: ${id}`)
    }
    const updated = await impactStoryApi().togglePublished1(
      Number(id),
      toPublishedToggleRequest(current, isPublic),
    )
    return mapStoryResponseToDomain(updated)
  }
  return setPublicLocal(id, isPublic)
}

export async function countPinnedStoriesService(
  excludeId?: string,
  cachedStories?: ImpactStory[],
): Promise<number> {
  if (shouldUseImpactStoriesRemoteApi()) {
    if (cachedStories) {
      return cachedStories.filter(s => s.isPinned && s.id !== excludeId).length
    }
    // list 정렬: pinned desc — size=20면 고정(최대 9) 전부 포함
    const rows = await listRemoteStories()
    return rows.filter(s => s.isPinned && s.id !== excludeId).length
  }
  return countPinnedLocal(excludeId)
}

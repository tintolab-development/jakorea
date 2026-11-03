import type {
  Notice,
  NoticeAttachment,
  NoticeCreateInput,
  NoticeListFilter,
  NoticeUpdateInput,
} from '@/entities/notices/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import type { ToggleRequest } from '@/shared/api/generated/ja-korea/schemas/toggleRequest'
import { shouldUseNoticesRemoteApi } from './capabilities'
import {
  mapNoticeResponseToDomain,
  resolvePrimaryAttachmentAssetId,
  toBulkDeleteRequest,
  toNoticeCreateRequest,
  toNoticeListParams,
  toNoticeUpdateRequest,
  toPublishedToggleRequest,
} from './mappers'
import {
  fetchAllAdminListPages,
  paginateLocalRows,
  toAdminListPage,
  type AdminListPage,
} from '@/shared/lib/admin-infinite-list'
import {
  createNotice as createLocal,
  getNoticeById,
  readNotices,
  removeNotices as removeLocal,
  setNoticePublic as setPublicLocal,
  updateNotice as updateLocal,
} from './store'
import { uploadNoticeAttachmentAsset } from './upload-notice-attachment'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function listRemoteNoticesPage(
  filter: NoticeListFilter | undefined,
  page: number,
): Promise<AdminListPage<Notice>> {
  const response = await jaKoreaApi().list5(toNoticeListParams(filter, page))
  return toAdminListPage(
    (response.items ?? []).map(mapNoticeResponseToDomain),
    page,
    response,
  )
}

async function resolveAttachmentAssetId(
  attachments: NoticeAttachment[],
  fallbackAssetId?: number,
): Promise<number | undefined> {
  const withFile = attachments.find(att => att.file instanceof File)
  if (withFile?.file) {
    return uploadNoticeAttachmentAsset(withFile.file)
  }
  const fromExisting = resolvePrimaryAttachmentAssetId(attachments)
  if (fromExisting != null) return fromExisting
  return fallbackAssetId
}

export async function listNoticesPageService(
  filter: NoticeListFilter | undefined,
  page: number,
): Promise<AdminListPage<Notice>> {
  if (shouldUseNoticesRemoteApi()) {
    return listRemoteNoticesPage(filter, page)
  }
  return paginateLocalRows(readNotices(filter), page)
}

export async function getNoticeService(id: string): Promise<Notice | null> {
  if (shouldUseNoticesRemoteApi()) {
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) return null
    try {
      const row = await jaKoreaApi().detail(numericId)
      return mapNoticeResponseToDomain(row)
    } catch {
      return null
    }
  }
  return getNoticeById(id)
}

export async function createNoticeService(input: NoticeCreateInput): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    const attachmentAssetId = await resolveAttachmentAssetId(input.attachments)
    const created = await jaKoreaApi().create7(toNoticeCreateRequest(input, attachmentAssetId))
    return mapNoticeResponseToDomain(created)
  }
  return createLocal(input)
}

export async function updateNoticeService(
  input: NoticeUpdateInput,
  cached?: Notice | null,
): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    const current =
      cached && cached.id === input.id ? cached : await getNoticeService(input.id)
    if (!current) {
      throw new Error(`Notice not found: ${input.id}`)
    }
    const attachmentAssetId = await resolveAttachmentAssetId(
      input.attachments,
      current.attachments[0]?.assetId,
    )
    const updated = await jaKoreaApi().update8(
      Number(input.id),
      toNoticeUpdateRequest(input, current.version, attachmentAssetId),
    )
    return mapNoticeResponseToDomain(updated)
  }
  return updateLocal(input)
}

export async function removeNoticesService(
  ids: string[],
  cachedList?: Notice[],
): Promise<void> {
  if (shouldUseNoticesRemoteApi()) {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    let rows = (cachedList ?? []).filter(row => idSet.has(row.id))
    if (rows.length === 0) {
      const all = await fetchAllAdminListPages(page => listRemoteNoticesPage(undefined, page))
      rows = all.filter(row => idSet.has(row.id))
    }
    if (rows.length === 0) return
    await jaKoreaApi().bulkDelete3(toBulkDeleteRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function setNoticePublicService(
  id: string,
  isPublic: boolean,
  cached?: Notice | null,
): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    const current = cached && cached.id === id ? cached : await getNoticeService(id)
    if (!current) {
      throw new Error(`Notice not found: ${id}`)
    }
    // Generated ToggleRequest uses `enabled`, but JA Korea notices API expects `published`.
    const body = toPublishedToggleRequest(current, isPublic)
    const updated = await jaKoreaApi().togglePublished(
      Number(id),
      body as unknown as ToggleRequest,
    )
    return mapNoticeResponseToDomain(updated)
  }
  return setPublicLocal(id, isPublic)
}

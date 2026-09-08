import {
  mapCategoryItems,
  mapCreatedCategory,
  type CategoryRow,
} from '@/features/posts/api/shared/category-adapters'
import {
  mapNoticeListResponse,
  mapNoticeResponse,
  toNoticeRequestFromForm,
} from '@/features/posts/api/notices/adapters/notice-adapters'
import { noticesParamsFromSearchParams } from '@/features/posts/api/notices/notice-filter-params'
import {
  createNoticeCategoryRemote,
  createNoticeRemote,
  deleteNoticeCategoryRemote,
  deleteNoticeRemote,
  fetchNoticeCategoriesRemote,
  fetchNoticeRemote,
  fetchNoticesRemote,
  updateNoticeCategoryRemote,
  updateNoticeRemote,
} from '@/features/posts/api/notices/notices-api-client'
import type { Notice } from '@/data/mock/notices'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  hydrateNoticeAttachments,
  parseNoticeOwnerId,
  uploadAndAttachNoticeFiles,
} from '@/features/posts/api/notices/notice-attachments'

function assertNoticesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notices')) {
    throw new Error('공지 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notices를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('공지 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseNoticesRemoteApi(): boolean {
  return isRealApiModuleEnabled('notices') && hasRemoteAdminJwt()
}

export async function getNoticeList(searchParams: URLSearchParams): Promise<Notice[]> {
  assertNoticesRemoteReady()
  const dto = await fetchNoticesRemote(noticesParamsFromSearchParams(searchParams))
  return mapNoticeListResponse(dto)
}

export async function getNoticeDetail(id: string): Promise<Notice> {
  assertNoticesRemoteReady()
  const dto = await fetchNoticeRemote(id)
  return hydrateNoticeAttachments(mapNoticeResponse(dto))
}

async function attachNewNoticeFiles(notice: Notice, files: File[] | undefined): Promise<Notice> {
  const newFiles = files?.filter(file => file.size > 0) ?? []
  if (newFiles.length === 0) return notice
  const ownerId = parseNoticeOwnerId(notice.id)
  if (ownerId == null) {
    throw new Error('공지 ID를 확인하지 못해 첨부 파일을 업로드할 수 없습니다.')
  }
  const uploaded = await uploadAndAttachNoticeFiles(ownerId, newFiles)
  const attachments = [...(notice.attachments ?? []), ...uploaded]
  return {
    ...notice,
    attachments,
    hasAttachment: attachments.length > 0,
  }
}

export async function createNotice(params: BuildNoticeBodyParams): Promise<Notice> {
  assertNoticesRemoteReady()
  const dto = await createNoticeRemote(toNoticeRequestFromForm(params))
  const created = mapNoticeResponse(dto)
  return attachNewNoticeFiles(
    {
      ...created,
      category: created.category || params.category,
      categoryId: created.categoryId ?? params.categoryId,
    },
    params.newFiles
  )
}

export async function updateNotice(
  id: string,
  existing: Notice,
  params: BuildNoticeBodyParams
): Promise<Notice> {
  assertNoticesRemoteReady()
  const dto = await updateNoticeRemote(id, toNoticeRequestFromForm(params))
  const updated = mapNoticeResponse(dto)
  return attachNewNoticeFiles(
    {
      ...updated,
      category: updated.category || params.category,
      categoryId: updated.categoryId ?? params.categoryId,
      attachments: updated.attachments?.length ? updated.attachments : existing.attachments,
    },
    params.newFiles
  )
}

export async function deleteNotice(id: string): Promise<void> {
  assertNoticesRemoteReady()
  await deleteNoticeRemote(id)
}

export async function deleteNotices(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteNotice(id)
  }
}

export async function getNoticeCategories(): Promise<CategoryRow[]> {
  assertNoticesRemoteReady()
  const dto = await fetchNoticeCategoriesRemote({ page: 0, size: 100 })
  return mapCategoryItems(dto.items)
}

export async function createNoticeCategory(name: string): Promise<CategoryRow | null> {
  assertNoticesRemoteReady()
  const dto = await createNoticeCategoryRemote({
    categoryName: name,
    name,
    status: 'active',
  })
  return mapCreatedCategory(dto, name)
}

export async function updateNoticeCategory(categoryId: string, name: string): Promise<void> {
  assertNoticesRemoteReady()
  await updateNoticeCategoryRemote(categoryId, {
    categoryName: name,
    name,
    status: 'active',
  })
}

export async function deleteNoticeCategory(categoryId: string): Promise<void> {
  assertNoticesRemoteReady()
  await deleteNoticeCategoryRemote(categoryId)
}

import {
  mapCategoryItems,
  mapCreatedCategory,
  type CategoryRow,
} from '@/features/posts/api/shared/category-adapters'
import {
  mapNoticeListResponse,
  mapNoticeResponse,
  toNoticeRequestFromForm,
  toNoticeRequestFromNotice,
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
  linkNoticeAttachments,
  noticeUploadOwnerId,
  uploadAndAttachNoticeFiles,
} from '@/features/posts/api/notices/notice-attachments'

function assertNoticesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notices')) {
    throw new Error('공지 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.')
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

async function rethrowAfterRollback(error: unknown, rollback: () => Promise<unknown>): Promise<never> {
  try {
    await rollback()
  } catch {
    // 되돌리기 실패보다 첨부 업로드 실패를 전달한다.
  }
  throw error
}

function fileObjectIdsOf(attachments: Notice['attachments']): number[] {
  return (attachments ?? []).flatMap(item =>
    item.fileObjectId != null ? [item.fileObjectId] : []
  )
}

function sameFileObjectIds(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

async function attachNewNoticeFiles(
  notice: Notice,
  files: File[] | undefined,
  retainedFileObjectIds?: number[]
): Promise<Notice> {
  const newFiles = files?.filter(file => file.size > 0) ?? []
  const ownerId = noticeUploadOwnerId(notice)
  const previousIds = fileObjectIdsOf(notice.attachments)
  const retainedIds = retainedFileObjectIds ?? previousIds
  if (newFiles.length === 0 && sameFileObjectIds(retainedIds, previousIds)) return notice
  if (!notice.id || (newFiles.length > 0 && ownerId == null)) {
    throw new Error('공지 ID를 확인하지 못해 첨부 파일을 업로드할 수 없습니다.')
  }
  const uploaded = newFiles.length > 0 && ownerId != null
    ? await uploadAndAttachNoticeFiles(ownerId, newFiles)
    : []
  const uploadedIds = fileObjectIdsOf(uploaded)
  const attachments = await linkNoticeAttachments(notice.id, [...retainedIds, ...uploadedIds])
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
  try {
    return await attachNewNoticeFiles(
      {
        ...created,
        category: created.category || params.category,
        categoryId: created.categoryId ?? params.categoryId,
      },
      params.newFiles,
      params.retainedFileObjectIds
    )
  } catch (error) {
    return rethrowAfterRollback(error, async () => {
      if (created.id) await deleteNoticeRemote(created.id)
    })
  }
}

export async function updateNotice(
  id: string,
  existing: Notice,
  params: BuildNoticeBodyParams
): Promise<Notice> {
  assertNoticesRemoteReady()
  const dto = await updateNoticeRemote(id, toNoticeRequestFromForm(params))
  const updated = mapNoticeResponse(dto)
  try {
    return await attachNewNoticeFiles(
      {
        ...updated,
        category: updated.category || params.category,
        categoryId: updated.categoryId ?? params.categoryId,
        attachments: updated.attachments?.length ? updated.attachments : existing.attachments,
      },
      params.newFiles,
      params.retainedFileObjectIds ?? fileObjectIdsOf(existing.attachments)
    )
  } catch (error) {
    return rethrowAfterRollback(error, () =>
      updateNoticeRemote(id, toNoticeRequestFromNotice(existing))
    )
  }
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

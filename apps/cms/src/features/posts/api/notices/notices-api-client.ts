import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
} from '@/features/data-management/api/bulk-delete'
import { customInstance } from '@/shared/api/orval-mutator'
import { getJAKoreaCMSBackendAPIPostsSubset } from '@/shared/api/generated/posts/posts-api'
import type { NoticeWriteRequest } from '@/features/posts/api/notices/adapters/notice-adapters'
import type {
  ApiResponseMapStringObjectData,
  CategoryRequest,
  NoticeCategoriesParams,
  NoticeAttachmentResponse,
  NoticeRequest,
  NoticeResponse,
  NoticesParams,
  PageResponseMapStringObject,
  PageResponseNoticeResponse,
  BulkActionResponse,
} from '@/shared/api/generated/posts/schemas'

const postsApi = getJAKoreaCMSBackendAPIPostsSubset()

function pathId(id: string): string {
  return id
}

export async function fetchNoticesRemote(
  params: NoticesParams
): Promise<PageResponseNoticeResponse> {
  return unwrapApiBody(await postsApi.notices(params))
}

export async function fetchNoticeRemote(id: string): Promise<NoticeResponse> {
  return unwrapApiBody(await postsApi.notice(pathId(id)))
}

export async function createNoticeRemote(body: NoticeWriteRequest): Promise<NoticeResponse> {
  return unwrapApiBody(await postsApi.createNotice(body))
}

export async function updateNoticeRemote(
  id: string,
  body: NoticeRequest
): Promise<NoticeResponse> {
  return unwrapApiBody(await postsApi.updateNotice(pathId(id), body))
}

export async function deleteNoticeRemote(id: string): Promise<void> {
  await postsApi.deleteNotice(pathId(id))
}

/** Swagger `bulkDeleteNotices` — `POST /api/admin/content/notices/bulk-delete` */
export async function bulkDeleteNoticesRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const numericIds = chunk
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0)
    if (numericIds.length !== chunk.length) {
      throw new Error('삭제할 공지 ID가 올바르지 않습니다.')
    }
    const result = unwrapApiBody<BulkActionResponse>(
      await postsApi.bulkDeleteNotices({ ids: numericIds })
    )
    assertBulkDeleteSucceeded(result, '공지사항 일괄 삭제에 실패했습니다.')
  })
}

function noticeAttachmentPath(noticeId: string): string {
  return `/api/admin/content/notices/${encodeURIComponent(noticeId)}/attachments`
}

function attachmentRows(payload: unknown): NoticeAttachmentResponse[] {
  const body = unwrapApiBody<NoticeAttachmentResponse[] | { items?: NoticeAttachmentResponse[] }>(payload)
  if (Array.isArray(body)) return body
  return body?.items ?? []
}

export async function fetchNoticeAttachmentsRemote(
  noticeId: string
): Promise<NoticeAttachmentResponse[]> {
  return attachmentRows(
    await customInstance({
      url: noticeAttachmentPath(noticeId),
      method: 'GET',
    })
  )
}

export async function replaceNoticeInlineImagesRemote(
  noticeId: string,
  fileObjectIds: number[]
): Promise<void> {
  await unwrapApiBody(
    await postsApi.replaceNoticeInlineImages(pathId(noticeId), { fileObjectIds })
  )
}

export async function replaceNoticeAttachmentsRemote(
  noticeId: string,
  fileObjectIds: number[]
): Promise<NoticeAttachmentResponse[]> {
  return attachmentRows(
    await customInstance({
      url: noticeAttachmentPath(noticeId),
      method: 'PUT',
      data: { fileObjectIds },
    })
  )
}

export async function fetchNoticeCategoriesRemote(
  params?: NoticeCategoriesParams
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.noticeCategories(params))
}

export async function createNoticeCategoryRemote(
  body: CategoryRequest
): Promise<ApiResponseMapStringObjectData | PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.createNoticeCategory(body))
}

export async function updateNoticeCategoryRemote(
  categoryId: string,
  body: CategoryRequest
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.updateNoticeCategory(pathId(categoryId), body))
}

export async function deleteNoticeCategoryRemote(categoryId: string): Promise<void> {
  await postsApi.deleteNoticeCategory(pathId(categoryId))
}

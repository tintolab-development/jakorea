import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIPostsSubset } from '@/shared/api/generated/posts/posts-api'
import type {
  CategoryRequest,
  NoticeCategoriesParams,
  NoticeRequest,
  NoticeResponse,
  NoticesParams,
  PageResponseMapStringObject,
  PageResponseNoticeResponse,
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

export async function createNoticeRemote(body: NoticeRequest): Promise<NoticeResponse> {
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

export async function fetchNoticeCategoriesRemote(
  params?: NoticeCategoriesParams
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.noticeCategories(params))
}

export async function createNoticeCategoryRemote(
  body: CategoryRequest
): Promise<PageResponseMapStringObject> {
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

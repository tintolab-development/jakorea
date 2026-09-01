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
  return mapNoticeResponse(dto)
}

export async function createNotice(params: BuildNoticeBodyParams): Promise<Notice> {
  assertNoticesRemoteReady()
  const dto = await createNoticeRemote(toNoticeRequestFromForm(params))
  return mapNoticeResponse(dto)
}

export async function updateNotice(
  id: string,
  existing: Notice,
  params: BuildNoticeBodyParams
): Promise<Notice> {
  assertNoticesRemoteReady()
  const merged: Notice = {
    ...existing,
    title: params.title.trim(),
    content: params.contentMarkdown,
    category: params.category,
    status: params.visibility === 'public' ? 'published' : 'draft',
    isImportant: params.pinToTop,
    hasAttachment: params.attachmentNames.some(n => n.trim()),
  }
  const dto = await updateNoticeRemote(id, toNoticeRequestFromNotice(merged))
  return mapNoticeResponse(dto)
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
  const dto = await fetchNoticeCategoriesRemote({ page: 0, size: 50 })
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

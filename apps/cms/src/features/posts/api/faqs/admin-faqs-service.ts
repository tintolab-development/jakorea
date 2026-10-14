import {
  mapCategoryItems,
  mapCreatedCategory,
  type CategoryRow,
} from '@/features/posts/api/shared/category-adapters'
import type { PostsListPage } from '@/features/posts/api/posts-list-page'
import { mapPostsListPage } from '@/features/posts/api/shared/map-posts-list-page'
import {
  mapFaqResponse,
  toFaqRequest,
  type FaqCreatePayload,
  type FaqUpdatePayload,
} from '@/features/posts/api/faqs/adapters/faq-adapters'
import { faqsParamsFromSearchParams } from '@/features/posts/api/faqs/faq-filter-params'
import {
  createFaqCategoryRemote,
  createFaqRemote,
  deleteFaqCategoryRemote,
  deleteFaqRemote,
  fetchFaqCategoriesRemote,
  fetchFaqRemote,
  fetchFaqsRemote,
  replaceFaqInlineImagesRemote,
  updateFaqCategoryRemote,
  updateFaqRemote,
} from '@/features/posts/api/faqs/faqs-api-client'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'
import type { AdminFaq } from '@/features/posts/model/admin-faq'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertFaqsRemoteReady(): void {
  if (!isRealApiModuleEnabled('faqs')) {
    throw new Error('FAQ API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('FAQ 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseFaqsRemoteApi(): boolean {
  return isRealApiModuleEnabled('faqs') && hasRemoteAdminJwt()
}

export async function getFaqListPage(
  searchParams: URLSearchParams,
  page: number
): Promise<PostsListPage<AdminFaq>> {
  assertFaqsRemoteReady()
  const dto = await fetchFaqsRemote(faqsParamsFromSearchParams(searchParams, page))
  return mapPostsListPage(dto, mapFaqResponse)
}

export async function getFaqList(searchParams: URLSearchParams): Promise<AdminFaq[]> {
  const page = await getFaqListPage(searchParams, 0)
  return page.items
}

export async function getFaqDetail(id: string): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const dto = await fetchFaqRemote(id)
  return mapFaqResponse(dto)
}

function extractInlineImageFileObjectIds(text: string | undefined): number[] {
  if (!text) return []
  const ids = new Set<number>()
  const pattern = /\/api\/admin\/files\/(\d+)\/content/g
  for (const match of text.matchAll(pattern)) {
    const id = Number(match[1])
    if (Number.isFinite(id)) ids.add(id)
  }
  return [...ids]
}

async function syncFaqInlineImages(faqId: string, answer: string | undefined): Promise<void> {
  const fileObjectIds = extractInlineImageFileObjectIds(answer)
  await replaceFaqInlineImagesRemote(faqId, fileObjectIds)
}

async function rethrowAfterRollback(error: unknown, rollback: () => Promise<unknown>): Promise<never> {
  try {
    await rollback()
  } catch {
    // 되돌리기 실패보다 이미지 바인딩 실패를 전달한다.
  }
  throw error
}

export async function createFaq(payload: FaqCreatePayload): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const dto = await createFaqRemote(toFaqRequest(payload))
  const mapped = mapFaqResponse(dto)
  try {
    await syncFaqInlineImages(mapped.id, payload.answer)
  } catch (error) {
    return rethrowAfterRollback(error, () => deleteFaqRemote(mapped.id))
  }
  return mapped
}

export async function updateFaq(id: string, patch: FaqUpdatePayload): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const existing = await getFaqDetail(id)
  const dto = await updateFaqRemote(
    id,
    toFaqRequest({
      category: patch.category ?? existing.category,
      question: patch.question ?? existing.question,
      answer: patch.answer ?? existing.answer,
      author: patch.author ?? existing.author,
      status: patch.status ?? existing.status,
    })
  )
  const mapped = mapFaqResponse(dto)
  try {
    await syncFaqInlineImages(id, patch.answer ?? existing.answer)
  } catch (error) {
    return rethrowAfterRollback(error, () => updateFaqRemote(id, toFaqRequest(existing)))
  }
  return mapped
}

export async function deleteFaq(id: string): Promise<void> {
  assertFaqsRemoteReady()
  await deleteFaqRemote(id)
}

export async function deleteFaqs(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteFaq(id)
  }
}

export async function getFaqCategories(): Promise<CategoryRow[]> {
  assertFaqsRemoteReady()
  const items = await fetchAllApiPages((page, size) =>
    fetchFaqCategoriesRemote({ page, size })
  )
  return mapCategoryItems(items)
}

export async function createFaqCategory(name: string): Promise<CategoryRow | null> {
  assertFaqsRemoteReady()
  const dto = await createFaqCategoryRemote({
    categoryName: name,
    name,
    status: 'active',
  })
  return mapCreatedCategory(dto, name)
}

export async function updateFaqCategory(categoryId: string, name: string): Promise<void> {
  assertFaqsRemoteReady()
  await updateFaqCategoryRemote(categoryId, {
    categoryName: name,
    name,
    status: 'active',
  })
}

export async function deleteFaqCategory(categoryId: string): Promise<void> {
  assertFaqsRemoteReady()
  await deleteFaqCategoryRemote(categoryId)
}

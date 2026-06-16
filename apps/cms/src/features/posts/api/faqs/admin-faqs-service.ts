import {
  mapCategoryItem,
  mapCategoryItems,
  type CategoryRow,
} from '@/features/posts/api/shared/category-adapters'
import {
  mapFaqListResponse,
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
  updateFaqCategoryRemote,
  updateFaqRemote,
} from '@/features/posts/api/faqs/faqs-api-client'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertFaqsRemoteReady(): void {
  if (!isRealApiModuleEnabled('faqs')) {
    throw new Error('FAQ API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 faqs를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('FAQ 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseFaqsRemoteApi(): boolean {
  return isRealApiModuleEnabled('faqs') && hasRemoteAdminJwt()
}

export async function getFaqList(searchParams: URLSearchParams): Promise<AdminFaq[]> {
  assertFaqsRemoteReady()
  const dto = await fetchFaqsRemote(faqsParamsFromSearchParams(searchParams))
  return mapFaqListResponse(dto)
}

export async function getFaqDetail(id: string): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const dto = await fetchFaqRemote(id)
  return mapFaqResponse(dto)
}

export async function createFaq(payload: FaqCreatePayload): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const dto = await createFaqRemote(toFaqRequest(payload))
  return mapFaqResponse(dto)
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
  return mapFaqResponse(dto)
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
  const dto = await fetchFaqCategoriesRemote({ page: 0, size: 200 })
  return mapCategoryItems(dto.items)
}

export async function createFaqCategory(name: string): Promise<CategoryRow> {
  assertFaqsRemoteReady()
  const dto = await createFaqCategoryRemote({
    categoryName: name,
    name,
    status: 'active',
  })
  const created = mapCategoryItems(dto.items).find(c => c.name === name)
  if (created) return created
  const fallback = dto.items?.[0] ? mapCategoryItem(dto.items[0]) : null
  if (fallback) return fallback
  throw new Error('카테고리 생성 응답을 확인할 수 없습니다.')
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

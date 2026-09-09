import {
  mapCategoryItems,
  mapCreatedCategory,
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
  replaceFaqInlineImagesRemote,
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
  try {
    await replaceFaqInlineImagesRemote(faqId, fileObjectIds)
  } catch {
    /* 인라인 이미지 바인딩 실패는 FAQ 본문 저장을 막지 않음 */
  }
}

export async function createFaq(payload: FaqCreatePayload): Promise<AdminFaq> {
  assertFaqsRemoteReady()
  const dto = await createFaqRemote(toFaqRequest(payload))
  const mapped = mapFaqResponse(dto)
  await syncFaqInlineImages(mapped.id, payload.answer)
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
  await syncFaqInlineImages(id, patch.answer ?? existing.answer)
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
  const dto = await fetchFaqCategoriesRemote({ page: 0, size: 50 })
  return mapCategoryItems(dto.items)
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

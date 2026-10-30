import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { deletePostsByBulkIdsOrEach } from '@/features/posts/api/shared/posts-bulk-delete'
import { customInstance } from '@/shared/api/orval-mutator'
import { getJAKoreaCMSBackendAPIPostsSubset } from '@/shared/api/generated/posts/posts-api'
import type {
  CategoryRequest,
  FaqCategoriesParams,
  FaqRequest,
  FaqResponse,
  FaqsParams,
  PageResponseFaqResponse,
  PageResponseMapStringObject,
} from '@/shared/api/generated/posts/schemas'
import {
  patchCategoryBatchChanges,
  type CategoryBatchSaveResponse,
} from '@/features/posts/api/shared/category-bulk-api'
import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'

const postsApi = getJAKoreaCMSBackendAPIPostsSubset()

function pathId(id: string): string {
  return id
}

export async function fetchFaqsRemote(params: FaqsParams): Promise<PageResponseFaqResponse> {
  return unwrapApiBody(await postsApi.faqs(params))
}

export async function fetchFaqRemote(id: string): Promise<FaqResponse> {
  return unwrapApiBody(await postsApi.faq(pathId(id)))
}

export async function createFaqRemote(body: FaqRequest): Promise<FaqResponse> {
  return unwrapApiBody(await postsApi.createFaq(body))
}

export async function updateFaqRemote(id: string, body: FaqRequest): Promise<FaqResponse> {
  return unwrapApiBody(await postsApi.updateFaq(pathId(id), body))
}

export async function deleteFaqRemote(id: string): Promise<void> {
  await postsApi.deleteFaq(pathId(id))
}

/** Swagger `bulkDeleteFaqs` — `POST /api/admin/content/faqs/bulk-delete` */
export async function bulkDeleteFaqsRemote(ids: string[]): Promise<void> {
  await deletePostsByBulkIdsOrEach(ids, {
    bulk: numericIds => postsApi.bulkDeleteFaqs({ ids: numericIds }),
    each: id => deleteFaqRemote(id),
    failedMessage: 'FAQ 일괄 삭제에 실패했습니다.',
  })
}

export async function fetchFaqCategoriesRemote(
  params?: FaqCategoriesParams
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.faqCategories(params))
}

export async function createFaqCategoryRemote(
  body: CategoryRequest
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.createFaqCategory(body))
}

export async function updateFaqCategoryRemote(
  categoryId: string,
  body: CategoryRequest
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.updateFaqCategory(pathId(categoryId), body))
}

export async function deleteFaqCategoryRemote(categoryId: string): Promise<void> {
  await postsApi.deleteFaqCategory(pathId(categoryId))
}

export async function bulkChangeFaqCategoriesRemote(
  changes: CategoryManagementDraftChanges
): Promise<CategoryBatchSaveResponse> {
  return patchCategoryBatchChanges('/api/admin/content/faq-categories/bulk-changes', changes)
}

function faqInlineImagePath(faqId: string): string {
  return `/api/admin/content/faqs/${encodeURIComponent(faqId)}/inline-images`
}

export async function fetchFaqInlineImagesRemote(faqId: string): Promise<unknown> {
  return unwrapApiBody(
    await customInstance({
      url: faqInlineImagePath(faqId),
      method: 'GET',
    })
  )
}

export async function replaceFaqInlineImagesRemote(
  faqId: string,
  fileObjectIds: number[]
): Promise<unknown> {
  return unwrapApiBody(
    await customInstance({
      url: faqInlineImagePath(faqId),
      method: 'PUT',
      data: { fileObjectIds },
    })
  )
}

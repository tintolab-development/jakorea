import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
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

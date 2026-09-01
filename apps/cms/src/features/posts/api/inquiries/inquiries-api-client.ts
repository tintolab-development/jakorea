import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIPostsSubset } from '@/shared/api/generated/posts/posts-api'
import type {
  CategoryRequest,
  Inquiries1Params,
  InquiryAnswerRequest,
  InquiryAnswerResponse,
  InquiryAnswerUpdateRequest,
  InquiryCategoriesParams,
  InquiryResponse,
  PageResponse,
  PageResponseMapStringObject,
} from '@/shared/api/generated/posts/schemas'

const postsApi = getJAKoreaCMSBackendAPIPostsSubset()

function pathId(id: string): number {
  const parsed = Number(id)
  return Number.isFinite(parsed) ? parsed : (id as unknown as number)
}

export async function fetchInquiriesRemote(params: Inquiries1Params): Promise<PageResponse> {
  return unwrapApiBody(await postsApi.inquiries1(params))
}

export async function fetchInquiryRemote(id: string): Promise<InquiryResponse> {
  return unwrapApiBody(await postsApi.inquiry1(pathId(id)))
}

export async function fetchInquiryAnswersRemote(
  inquiryId: string
): Promise<InquiryAnswerResponse[]> {
  return unwrapApiBody(await postsApi.answers(pathId(inquiryId)))
}

export async function createInquiryAnswerRemote(
  inquiryId: string,
  body: InquiryAnswerRequest
): Promise<unknown> {
  return unwrapApiBody(await postsApi.answer(pathId(inquiryId), body))
}

export async function updateInquiryAnswerRemote(
  inquiryId: string,
  answerId: string,
  body: InquiryAnswerUpdateRequest
): Promise<unknown> {
  return unwrapApiBody(await postsApi.updateInquiryAnswer(pathId(inquiryId), pathId(answerId), body))
}

export async function deleteInquiryRemote(id: string): Promise<void> {
  await postsApi.deleteInquiry(pathId(id))
}

export async function bulkDeleteInquiriesRemote(ids: string[]): Promise<void> {
  const numericIds = ids.map(pathId).filter((id): id is number => Number.isFinite(id))
  if (numericIds.length === 0) {
    throw new Error('삭제할 문의 ID가 올바르지 않습니다.')
  }
  await postsApi.bulkDelete2({ ids: numericIds })
}

function categoryPathId(id: string): string {
  return id
}

export async function fetchInquiryCategoriesRemote(
  params?: InquiryCategoriesParams
): Promise<PageResponseMapStringObject> {
  return unwrapApiBody(await postsApi.inquiryCategories(params))
}

export async function createInquiryCategoryRemote(body: CategoryRequest): Promise<unknown> {
  return unwrapApiBody(await postsApi.createInquiryCategory(body))
}

export async function updateInquiryCategoryRemote(
  categoryId: string,
  body: CategoryRequest
): Promise<void> {
  await postsApi.updateInquiryCategory(categoryPathId(categoryId), body)
}

export async function deleteInquiryCategoryRemote(categoryId: string): Promise<void> {
  await postsApi.deleteInquiryCategory(categoryPathId(categoryId))
}

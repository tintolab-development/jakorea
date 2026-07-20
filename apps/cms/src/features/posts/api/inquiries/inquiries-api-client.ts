import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIPostsSubset } from '@/shared/api/generated/posts/posts-api'
import type {
  InquiryAnswerRequest,
  InquiryAnswerResponse,
  InquiryAnswerUpdateRequest,
  InquiryResponse,
  InquiriesParams,
  PageResponse,
} from '@/shared/api/generated/posts/schemas'

const postsApi = getJAKoreaCMSBackendAPIPostsSubset()

function pathId(id: string): number {
  const parsed = Number(id)
  return Number.isFinite(parsed) ? parsed : (id as unknown as number)
}

export async function fetchInquiriesRemote(params: InquiriesParams): Promise<PageResponse> {
  return unwrapApiBody(await postsApi.inquiries(params))
}

export async function fetchInquiryRemote(id: string): Promise<InquiryResponse> {
  return unwrapApiBody(await postsApi.inquiry(pathId(id)))
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

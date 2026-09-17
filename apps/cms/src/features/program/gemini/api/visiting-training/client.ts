import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { BulkDecisionRequest } from '@/shared/api/generated/dashboard/schemas/bulkDecisionRequest'
import type { BulkIdsRequest } from '@/shared/api/generated/dashboard/schemas/bulkIdsRequest'
import type { GeminiApprovedTrainingItem } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingItem'
import type { GeminiApprovedTrainingListResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingListResponse'
import type { GeminiOrganizationApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationItem'
import type { GeminiOrganizationApplicationListResponse } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationListResponse'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { GeminiRecruitmentListResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentListResponse'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'

const BASE = '/api/admin/gemini/trainings'

const DEFAULT_REJECT_REASON = '관리자 반려'
export const GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE = 20

type PageEnvelope<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

function toPageEnvelope<T>(
  body: { content?: T[]; page?: number; size?: number; totalElements?: number } | T[],
  requestedPage: number,
  requestedSize: number
): PageEnvelope<T> {
  if (Array.isArray(body)) {
    return {
      items: body,
      page: requestedPage,
      size: requestedSize,
      totalElements: body.length,
      hasMore: false,
    }
  }
  const items = body.content ?? []
  const page = body.page ?? requestedPage
  const size = body.size ?? requestedSize
  const totalElements = body.totalElements ?? items.length
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : page + 1
  return {
    items,
    page,
    size,
    totalElements,
    hasMore: page + 1 < totalPages,
  }
}

function appendPageParams(
  query: URLSearchParams,
  page: number,
  size: number
): void {
  query.set('page', String(page))
  query.set('size', String(size))
}

export type GeminiRecruitmentRemoteFilters = {
  keyword?: string
  periodStatus?: string
}

export async function fetchGeminiRecruitmentsRemotePage(
  filters: GeminiRecruitmentRemoteFilters = {},
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiRecruitmentItem>> {
  const query = new URLSearchParams()
  if (filters.keyword) query.set('keyword', filters.keyword)
  if (filters.periodStatus) query.set('periodStatus', filters.periodStatus)
  appendPageParams(query, page, size)
  const body = await unwrapApiBody<GeminiRecruitmentListResponse | GeminiRecruitmentItem[]>(
    await customInstance({
      url: `${BASE}/recruitments?${query.toString()}`,
      method: 'GET',
    })
  )
  return toPageEnvelope(body, page, size)
}

export async function fetchGeminiRecruitmentDetailRemote(
  programId: string
): Promise<GeminiRecruitmentDetailResponse> {
  return unwrapApiBody<GeminiRecruitmentDetailResponse>(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}`,
      method: 'GET',
    })
  )
}

export async function fetchGeminiOrganizationApplicationsRemote(
  programId: string,
  status: string | undefined,
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiOrganizationApplicationItem>> {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  appendPageParams(query, page, size)
  const body = await unwrapApiBody<
    GeminiOrganizationApplicationListResponse | GeminiOrganizationApplicationItem[]
  >(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}/organization-applications?${query.toString()}`,
      method: 'GET',
    })
  )
  return toPageEnvelope(body, page, size)
}

export async function fetchGeminiApprovedTrainingsRemote(
  keyword: string | undefined,
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiApprovedTrainingItem>> {
  const query = new URLSearchParams()
  if (keyword) query.set('keyword', keyword)
  appendPageParams(query, page, size)
  const body = await unwrapApiBody<
    GeminiApprovedTrainingListResponse | GeminiApprovedTrainingItem[]
  >(
    await customInstance({
      url: `${BASE}/approved?${query.toString()}`,
      method: 'GET',
    })
  )
  return toPageEnvelope(body, page, size)
}

export async function createGeminiRecruitmentRemote(
  body: ProgramCreateRequest
): Promise<ProgramResponse> {
  return unwrapApiBody<ProgramResponse>(
    await customInstance({
      url: `${BASE}/recruitments`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function updateGeminiRecruitmentRemote(
  programId: string,
  body: ProgramUpdateRequest
): Promise<ProgramResponse> {
  return unwrapApiBody<ProgramResponse>(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function deleteGeminiRecruitmentRemote(programId: string): Promise<void> {
  await customInstance({
    url: `${BASE}/recruitments/${encodeURIComponent(programId)}`,
    method: 'DELETE',
  })
}

export async function bulkDeleteGeminiRecruitmentsRemote(ids: number[]): Promise<void> {
  const body: BulkIdsRequest = { ids }
  await customInstance({
    url: `${BASE}/recruitments/bulk-delete`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function approveGeminiOrganizationApplicationRemote(
  applicationId: string
): Promise<void> {
  await customInstance({
    url: `${BASE}/organization-applications/${encodeURIComponent(applicationId)}/approve`,
    method: 'POST',
  })
}

export async function rejectGeminiOrganizationApplicationRemote(
  applicationId: string,
  reason = DEFAULT_REJECT_REASON
): Promise<void> {
  const body: ApplicationRejectRequest = { reason }
  await customInstance({
    url: `${BASE}/organization-applications/${encodeURIComponent(applicationId)}/reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function bulkApproveGeminiOrganizationApplicationsRemote(
  ids: number[]
): Promise<void> {
  const body: BulkIdsRequest = { ids }
  await customInstance({
    url: `${BASE}/organization-applications/bulk-approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function bulkRejectGeminiOrganizationApplicationsRemote(
  ids: number[],
  reason = DEFAULT_REJECT_REASON
): Promise<void> {
  const body: BulkDecisionRequest = { ids, reason }
  await customInstance({
    url: `${BASE}/organization-applications/bulk-reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function approveGeminiInstructorApplicationRemote(
  applicationId: string
): Promise<void> {
  await customInstance({
    url: `${BASE}/instructor-applications/${encodeURIComponent(applicationId)}/approve`,
    method: 'POST',
  })
}

export async function rejectGeminiInstructorApplicationRemote(
  applicationId: string,
  reason = DEFAULT_REJECT_REASON
): Promise<void> {
  const body: ApplicationRejectRequest = { reason }
  await customInstance({
    url: `${BASE}/instructor-applications/${encodeURIComponent(applicationId)}/reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

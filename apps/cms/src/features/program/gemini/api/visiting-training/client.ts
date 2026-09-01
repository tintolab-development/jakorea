import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { BulkDecisionRequest } from '@/shared/api/generated/dashboard/schemas/bulkDecisionRequest'
import type { BulkIdsRequest } from '@/shared/api/generated/dashboard/schemas/bulkIdsRequest'
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

function asContentArray<T>(
  body: { content?: T[] } | T[] | null | undefined
): T[] {
  if (Array.isArray(body)) return body
  return body?.content ?? []
}

export async function fetchGeminiRecruitmentsRemote(): Promise<GeminiRecruitmentItem[]> {
  const body = await unwrapApiBody<GeminiRecruitmentListResponse | GeminiRecruitmentItem[]>(
    await customInstance({
      url: `${BASE}/recruitments`,
      method: 'GET',
    })
  )
  return asContentArray(body)
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
  programId: string
): Promise<GeminiOrganizationApplicationItem[]> {
  const body = await unwrapApiBody<
    GeminiOrganizationApplicationListResponse | GeminiOrganizationApplicationItem[]
  >(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}/organization-applications`,
      method: 'GET',
    })
  )
  return asContentArray(body)
}

export async function fetchGeminiApprovedTrainingsRemote(): Promise<GeminiRecruitmentItem[]> {
  const body = await unwrapApiBody<GeminiRecruitmentListResponse | GeminiRecruitmentItem[]>(
    await customInstance({
      url: `${BASE}/approved`,
      method: 'GET',
    })
  )
  return asContentArray(body)
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

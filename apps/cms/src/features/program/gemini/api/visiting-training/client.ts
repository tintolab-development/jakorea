import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
import type { BulkDecisionRequest } from '@/shared/api/generated/dashboard/schemas/bulkDecisionRequest'
import type { BulkIdsRequest } from '@/shared/api/generated/dashboard/schemas/bulkIdsRequest'
import {
  toGeminiOrganizationApplicationApproveBody,
  type GeminiOrganizationApplicationApprovePayload,
} from './organization-application-approve'
import type { GeminiApprovedTrainingDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingDetailResponse'
import type { GeminiApprovedTrainingItem } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingItem'
import type { GeminiApprovedTrainingListResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingListResponse'
import type { GeminiInstructorApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiInstructorApplicationItem'
import type { GeminiInstructorApplicationListResponse } from '@/shared/api/generated/dashboard/schemas/geminiInstructorApplicationListResponse'
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
  filters: {
    status?: string
    organizationName?: string
    regionSido?: string
    regionSigungu?: string
    teacherName?: string
  } = {},
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiOrganizationApplicationItem>> {
  const query = new URLSearchParams()
  if (filters.status) query.set('status', filters.status)
  if (filters.organizationName) query.set('organizationName', filters.organizationName)
  if (filters.regionSido) query.set('regionSido', filters.regionSido)
  if (filters.regionSigungu) query.set('regionSigungu', filters.regionSigungu)
  if (filters.teacherName) query.set('teacherName', filters.teacherName)
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

/** OpenAPI는 현재 keyword만 정의. 나머지는 BE 반영 전까지 서버에서 무시됨 */
export type GeminiApprovedTrainingRemoteFilters = {
  keyword?: string
  institutionSido?: string
  institutionSigungu?: string
  status?: string
  officialDocumentRequired?: boolean
  trainingDateFrom?: string
  trainingDateTo?: string
}

export async function fetchGeminiApprovedTrainingsRemote(
  filters: GeminiApprovedTrainingRemoteFilters = {},
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiApprovedTrainingItem>> {
  const query = new URLSearchParams()
  if (filters.keyword) query.set('keyword', filters.keyword)
  if (filters.institutionSido) query.set('institutionSido', filters.institutionSido)
  if (filters.institutionSigungu) query.set('institutionSigungu', filters.institutionSigungu)
  if (filters.status) query.set('status', filters.status)
  if (filters.officialDocumentRequired !== undefined) {
    query.set('officialDocumentRequired', String(filters.officialDocumentRequired))
  }
  if (filters.trainingDateFrom) query.set('trainingDateFrom', filters.trainingDateFrom)
  if (filters.trainingDateTo) query.set('trainingDateTo', filters.trainingDateTo)
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

export async function fetchGeminiApprovedTrainingDetailRemote(
  approvedTrainingId: string
): Promise<GeminiApprovedTrainingDetailResponse> {
  return unwrapApiBody<GeminiApprovedTrainingDetailResponse>(
    await customInstance({
      url: `${BASE}/approved/${encodeURIComponent(approvedTrainingId)}`,
      method: 'GET',
    })
  )
}

/** 승인 연수 상세와 같은 스키마. 교사·배정 강사 개인정보만 원문이다. 캐시하지 않는다. */
export async function unmaskGeminiApprovedTrainingPrivacyRemote(
  approvedTrainingId: string,
  reason: string
): Promise<GeminiApprovedTrainingDetailResponse> {
  return unwrapApiBody<GeminiApprovedTrainingDetailResponse>(
    await customInstance({
      url: `${BASE}/approved/${encodeURIComponent(approvedTrainingId)}/privacy/unmask`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      data: { reason },
    })
  )
}

export type GeminiInstructorApplicationRemoteFilters = {
  status?: string
  instructorName?: string
  homeSido?: string
  homeSigungu?: string
  experienceYears?: string
  grade?: string
}

export async function fetchGeminiApprovedInstructorApplicationsRemote(
  approvedTrainingId: string,
  filters: GeminiInstructorApplicationRemoteFilters = {},
  page = 0,
  size = GEMINI_VISITING_TRAINING_LIST_PAGE_SIZE
): Promise<PageEnvelope<GeminiInstructorApplicationItem>> {
  const query = new URLSearchParams()
  if (filters.status) query.set('status', filters.status)
  if (filters.instructorName) query.set('instructorName', filters.instructorName)
  if (filters.homeSido) query.set('homeSido', filters.homeSido)
  if (filters.homeSigungu) query.set('homeSigungu', filters.homeSigungu)
  if (filters.experienceYears) query.set('experienceYears', filters.experienceYears)
  if (filters.grade) query.set('grade', filters.grade)
  appendPageParams(query, page, size)
  const body = await unwrapApiBody<
    GeminiInstructorApplicationListResponse | GeminiInstructorApplicationItem[]
  >(
    await customInstance({
      url: `${BASE}/approved/${encodeURIComponent(approvedTrainingId)}/instructor-applications?${query.toString()}`,
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

export async function deleteGeminiApprovedTrainingRemote(
  approvedTrainingId: string,
  reason: string | null = null
): Promise<void> {
  const query = new URLSearchParams()
  query.set('reason', reason ?? '')
  await customInstance({
    url: `${BASE}/approved/${encodeURIComponent(approvedTrainingId)}?${query.toString()}`,
    method: 'DELETE',
  })
}

/** OpenAPI operationId: bulkDeleteApprovedTrainings — 부분 성공 가능 */
export async function bulkDeleteGeminiApprovedTrainingsRemote(
  ids: number[],
  reason: string | null = null
): Promise<BulkActionResponse> {
  const body = { ids, reason }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: `${BASE}/approved/bulk-delete`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export type { GeminiOrganizationApplicationApprovePayload }

export async function approveGeminiOrganizationApplicationRemote(
  applicationId: string,
  payload?: GeminiOrganizationApplicationApprovePayload
): Promise<void> {
  await customInstance({
    url: `${BASE}/organization-applications/${encodeURIComponent(applicationId)}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: toGeminiOrganizationApplicationApproveBody(payload),
  })
}

export async function rejectGeminiOrganizationApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  await customInstance({
    url: `${BASE}/organization-applications/${encodeURIComponent(applicationId)}/reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
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
  payload: ApplicationRejectRequest
): Promise<void> {
  const body: BulkDecisionRequest = {
    ids,
    reason: payload.reason,
    ...(payload.timing ? { timing: payload.timing } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  }
  await customInstance({
    url: `${BASE}/organization-applications/bulk-reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export type GeminiOrganizationNotificationResendPayload = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt: string | null
  reason: string | null
}

/** OpenAPI operationId: resendGeminiOrganizationApplicationNotification */
export async function resendGeminiOrganizationApplicationNotificationRemote(
  applicationId: string,
  payload: GeminiOrganizationNotificationResendPayload,
  idempotencyKey: string
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${BASE}/organization-applications/${encodeURIComponent(applicationId)}/notifications/resend`,
      method: 'POST',
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    })
  )
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

export type GeminiInstructorNotificationResendPayload = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt: string | null
}

/**
 * Gemini 강사 신청 ID는 instructor-applications 재발송 API와 동일 PK.
 * Gemini 전용 resend path는 없다.
 */
export async function resendGeminiInstructorApplicationNotificationRemote(
  applicationId: string,
  payload: GeminiInstructorNotificationResendPayload
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/notifications/resend`,
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

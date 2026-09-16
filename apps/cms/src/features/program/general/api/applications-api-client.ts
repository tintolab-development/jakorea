import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas/applicationDecisionResponse'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
import type { BulkDecisionRequest } from '@/shared/api/generated/dashboard/schemas/bulkDecisionRequest'
import type { BulkIdsRequest } from '@/shared/api/generated/dashboard/schemas/bulkIdsRequest'
import type { BulkResultRequest } from '@/shared/api/generated/dashboard/schemas/bulkResultRequest'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { PageResponseOrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseOrganizationApplicationListItemResponse'
import type { DocumentResultRequest } from '@/shared/api/generated/dashboard/schemas/documentResultRequest'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { VolunteerFinalResultRequest } from '@/shared/api/generated/dashboard/schemas/volunteerFinalResultRequest'
import type { IndividualApplicationUpdateRequest } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateRequest'
import type { IndividualApplicationUpdateResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateResponse'
import type { IndividualApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationDetailResponse'
import type { IndividualDocumentEvaluationRequest } from '@/shared/api/generated/dashboard/schemas/individualDocumentEvaluationRequest'
import type { IndividualDocumentEvaluationResponse } from '@/shared/api/generated/dashboard/schemas/individualDocumentEvaluationResponse'
import type {
  IndividualApplicationListItemEnriched,
  InterviewAssignmentCreateRequestEnriched,
  InterviewAssignmentResponseEnriched,
} from '@/features/program/general/api/individual-application-screening-api-types'

export type ApplicationsListQuery = {
  status?: string
  page?: number
  size?: number
}

export interface ApplicationsPageDto<T> {
  items?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export type IndividualApplicationNotificationResendRequest = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt: string | null
  reason: string | null
}

export type IndividualApplicationUpdatePayload = Omit<
  IndividualApplicationUpdateRequest,
  'textbookId' | 'teamName' | 'teamRole' | 'managerComment'
> & {
  textbookId?: number | null
  teamName?: string | null
  teamRole?: 'LEADER' | 'MEMBER'
  managerComment?: string | null
}

async function fetchApplicationsPage<T>(
  url: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<T>> {
  return unwrapApiBody<ApplicationsPageDto<T>>(
    await customInstance({
      url,
      method: 'GET',
      params,
    })
  )
}

export async function fetchOrganizationApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<OrganizationApplicationListItemResponse>> {
  return fetchApplicationsPage<OrganizationApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/organization-applications`,
    params
  )
}

export async function fetchInstructorApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<InstructorApplicationListItemResponse>> {
  return fetchApplicationsPage<InstructorApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/instructor-applications`,
    params
  )
}

export async function fetchIndividualApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<IndividualApplicationListItemEnriched>> {
  return fetchApplicationsPage<IndividualApplicationListItemEnriched>(
    `/api/admin/programs/${encodeURIComponent(programId)}/individual-applications`,
    params
  )
}

export async function fetchIndividualApplicationDetailRemote(
  applicationId: string
): Promise<IndividualApplicationDetailResponse> {
  return unwrapApiBody<IndividualApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

export async function unmaskIndividualApplicationPrivacyRemote(
  applicationId: string,
  reason: string
): Promise<IndividualApplicationDetailResponse> {
  return unwrapApiBody<IndividualApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/privacy/unmask`,
      method: 'POST',
      data: { reason },
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

export async function updateIndividualDocumentEvaluationRemote(
  applicationId: string,
  managerSlot: 'A' | 'B',
  payload: IndividualDocumentEvaluationRequest
): Promise<IndividualDocumentEvaluationResponse> {
  return unwrapApiBody<IndividualDocumentEvaluationResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/document-evaluations/${managerSlot}`,
      method: 'PUT',
      data: payload,
    })
  )
}

export async function fetchVolunteerApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<VolunteerApplicationListItemResponse>> {
  return fetchApplicationsPage<VolunteerApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/volunteer-applications`,
    params
  )
}

export async function approveOrganizationApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectOrganizationApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function approveInstructorApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectInstructorApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * PATCH /api/admin/instructor-applications/{applicationId}
 * OpenAPI summary: 강사 신청 관리자 코멘트 수정
 * null 또는 trim 후 빈 문자열은 코멘트 삭제로 처리.
 */
export type InstructorApplicationManagerCommentUpdatePayload = {
  managerComment: string | null
}

export type InstructorApplicationManagerCommentUpdateResponse = {
  applicationId?: number
  managerComment?: string | null
  updatedAt?: string
}

export async function updateInstructorApplicationManagerCommentRemote(
  applicationId: string,
  payload: InstructorApplicationManagerCommentUpdatePayload
): Promise<InstructorApplicationManagerCommentUpdateResponse> {
  return unwrapApiBody<InstructorApplicationManagerCommentUpdateResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}`,
      method: 'PATCH',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/** POST /api/admin/instructor-applications/bulk-approve */
export async function bulkApproveInstructorApplicationsRemote(
  ids: number[]
): Promise<BulkActionResponse> {
  const body: BulkIdsRequest = { ids }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/bulk-approve`,
      method: 'POST',
      data: body,
    })
  )
}

/** POST /api/admin/instructor-applications/bulk-reject */
export async function bulkRejectInstructorApplicationsRemote(
  ids: number[],
  reason: string
): Promise<BulkActionResponse> {
  const body: BulkDecisionRequest = { ids, reason }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/bulk-reject`,
      method: 'POST',
      data: body,
    })
  )
}

export async function approveIndividualApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectIndividualApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * OpenAPI operationId: resendIndividualApplicationNotification
 * 로컬 codegen은 BE 재기동 후 교체한다.
 */
export async function resendIndividualApplicationNotification(
  applicationId: string,
  payload: IndividualApplicationNotificationResendRequest,
  idempotencyKey: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/notifications/resend`,
      method: 'POST',
      data: payload,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
  )
}

/**
 * OpenAPI operationId: updateIndividualApplication
 * 코멘트 모달에서는 managerComment만 전송한다.
 */
export async function updateIndividualApplication(
  applicationId: string,
  payload: IndividualApplicationUpdatePayload
): Promise<IndividualApplicationUpdateResponse> {
  return unwrapApiBody<IndividualApplicationUpdateResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}`,
      method: 'PATCH',
      data: payload,
    })
  )
}

export async function giveUpIndividualApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/give-up`,
      method: 'POST',
    })
  )
}

export async function giveUpVolunteerApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/give-up`,
      method: 'POST',
    })
  )
}

export async function submitIndividualDocumentResultRemote(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/document-result`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitIndividualFinalResultRemote(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/final-result`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitVolunteerDocumentResultRemote(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/document-result`,
      method: 'POST',
      data: payload,
    })
  )
}

/** POST /api/admin/volunteer-applications/document-results/bulk */
export async function bulkVolunteerDocumentResultsRemote(
  payload: BulkResultRequest
): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/volunteer-applications/document-results/bulk',
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitVolunteerFinalResultRemote(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/final-result`,
      method: 'POST',
      data: payload,
    })
  )
}

/** POST /api/admin/volunteer-applications/final-results/bulk */
export async function bulkVolunteerFinalResultsRemote(
  payload: BulkResultRequest
): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/volunteer-applications/final-results/bulk',
      method: 'POST',
      data: payload,
    })
  )
}

/** POST /api/admin/interview-assignments/{assignmentId}/evaluations */
export async function submitInterviewAssignmentEvaluationRemote(
  assignmentId: string | number,
  payload: import('@/shared/api/generated/dashboard/schemas/interviewEvaluationRequest').InterviewEvaluationRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/interviewEvaluationResponse').InterviewEvaluationResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/interview-assignments/${encodeURIComponent(String(assignmentId))}/evaluations`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function createInterviewSlotRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/interviewSlotCreateRequest').InterviewSlotCreateRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/interviewSlotResponse').InterviewSlotResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/interview-slots`,
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * GET /api/admin/programs/{programId}/interview-slots
 * OpenAPI GET/POST 등재. 404/실패 시 호출측에서 mock 폴백.
 */
export async function listInterviewSlotsRemote(
  programId: string,
  params?: { from?: string; to?: string }
): Promise<
  import('@/shared/api/generated/dashboard/schemas/interviewSlotResponse').InterviewSlotResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/interviewSlotResponse').InterviewSlotResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/interviewSlotResponse').InterviewSlotResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/interview-slots`,
      method: 'GET',
      params,
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

/**
 * Canonical 면접 배정.
 * volunteerApplicationId ↔ individualApplicationId 상호 배타.
 */
export async function createInterviewAssignmentRemote(
  payload: InterviewAssignmentCreateRequestEnriched
): Promise<InterviewAssignmentResponseEnriched> {
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/interview-assignments',
      method: 'POST',
      data: payload,
    })
  )
}

/** GET /api/admin/organization-applications/{id}/requested-schedules — 1사1교 희망일정 SSOT */
export async function fetchOrganizationApplicationRequestedSchedulesRemote(
  applicationId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/requestedScheduleResponse').RequestedScheduleResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/requestedScheduleResponse').RequestedScheduleResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/requestedScheduleResponse').RequestedScheduleResponse[]
        schedules?: import('@/shared/api/generated/dashboard/schemas/requestedScheduleResponse').RequestedScheduleResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/requested-schedules`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? body.schedules ?? []
}

export async function assignVolunteerInterviewSlotRemote(
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/interviewAssignmentRequest').InterviewAssignmentRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/interviewAssignmentResponse').InterviewAssignmentResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/applications/volunteers/${encodeURIComponent(applicationId)}/interview-assignments`,
      method: 'POST',
      data: payload,
    })
  )
}

export type { PageResponseOrganizationApplicationListItemResponse }

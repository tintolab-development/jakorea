import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { privacyUnmaskBody, type PrivacyRevealOptions } from '@/shared/lib/privacy-unmask-purpose'
import { getJAKoreaCMSBackendAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas/applicationDecisionResponse'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { ApplicationDecisionCancelRequest } from '@/shared/api/generated/dashboard/schemas/applicationDecisionCancelRequest'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
import type { IndividualApprovalWithScopeBulkTarget } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeBulkTarget'
import type { IndividualApprovalWithScopeRequest } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeRequest'
import type { IndividualApprovalWithScopeResult } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeResult'
import type { BulkDecisionRequest } from '@/shared/api/generated/dashboard/schemas/bulkDecisionRequest'
import type { TimedBulkIdsRequest } from '@/shared/api/generated/dashboard/schemas/timedBulkIdsRequest'
import type { BulkResultRequest } from '@/shared/api/generated/dashboard/schemas/bulkResultRequest'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { OrganizationApplications1Params } from '@/shared/api/generated/dashboard/schemas/organizationApplications1Params'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import type { OrganizationApplicationNotificationResendRequest as OrganizationApplicationNotificationResendRequestDto } from '@/shared/api/generated/dashboard/schemas/organizationApplicationNotificationResendRequest'
import type { OrganizationApplicationNotificationResendRequestTiming } from '@/shared/api/generated/dashboard/schemas/organizationApplicationNotificationResendRequestTiming'
import type { OrganizationApplicationUpdateRequest } from '@/shared/api/generated/dashboard/schemas/organizationApplicationUpdateRequest'
import type { OrganizationApplicationApproveRequest } from '@/shared/api/generated/dashboard/schemas/organizationApplicationApproveRequest'
import type { SlotRequest } from '@/shared/api/generated/dashboard/schemas/slotRequest'
import type { PageResponseOrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseOrganizationApplicationListItemResponse'
import type { DocumentResultRequest } from '@/shared/api/generated/dashboard/schemas/documentResultRequest'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { VolunteerApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationDetailResponse'
import type { VolunteerActivityRegionUpdateRequest } from '@/shared/api/generated/dashboard/schemas/volunteerActivityRegionUpdateRequest'
import type { VolunteerActivityRegionUpdateResponse } from '@/shared/api/generated/dashboard/schemas/volunteerActivityRegionUpdateResponse'
import type { VolunteerFinalResultRequest } from '@/shared/api/generated/dashboard/schemas/volunteerFinalResultRequest'
import type { IndividualApplicationUpdateRequest } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateRequest'
import type { IndividualApplicationUpdateResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateResponse'
import type { IndividualApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationDetailResponse'
import type { IndividualDocumentEvaluationRequest } from '@/shared/api/generated/dashboard/schemas/individualDocumentEvaluationRequest'
import type { IndividualDocumentEvaluationResponse } from '@/shared/api/generated/dashboard/schemas/individualDocumentEvaluationResponse'
import type { VolunteerDocumentEvaluationRequest } from '@/shared/api/generated/dashboard/schemas/volunteerDocumentEvaluationRequest'
import type { VolunteerDocumentEvaluationResponse } from '@/shared/api/generated/dashboard/schemas/volunteerDocumentEvaluationResponse'
import type {
  IndividualApplicationListItemEnriched,
  InterviewAssignmentCreateRequestEnriched,
  InterviewAssignmentResponseEnriched,
} from '@/features/program/general/api/individual-application-screening-api-types'

export type ApplicationsListQuery = {
  status?: string
  /** CMS 「신청 반려」 그룹. REJECTED + APPROVAL_CANCELLED. 단일 status=REJECTED와 구분 */
  statusGroup?: 'APPLICATION_REJECTED' | string
  page?: number
  size?: number
  /** 봉사자명 등 부분 검색 (`GET …/volunteer-applications`) */
  keyword?: string
  /** 서류 상태. PASS/FAIL 별칭 허용 */
  documentStatus?: string
  /** 면접 상태 (`interviewStage`와 동시 전송 불가) */
  interviewStatus?: string
  /** 2차 면접 stage 프리셋 (예: SECOND_ROUND). `interviewStatus`와 동시 전송 불가 */
  interviewStage?: string
  /** 2차 면접 유효 심사 현황(자동) — WAITING | COMPLETED */
  effectiveSecondInterviewStatus?: string
  /** 최종 결과 상태. APPROVED/REJECTED 별칭 허용 */
  finalResultStatus?: string
  /** JA 봉사 재참여 여부 */
  isReparticipation?: boolean
  /** 담당자 A 평가 — PASS/NEUTRAL/FAIL/UNREVIEWED */
  managerAEvaluation?: string
  /** 담당자 B 평가 — PASS/NEUTRAL/FAIL/UNREVIEWED */
  managerBEvaluation?: string
  /** UJAT 상·하반기 — FIRST_HALF | SECOND_HALF (별칭 H1/H2 허용) */
  recruitHalf?: string
  /** 모집 ID 직접 지정 (선택) */
  recruitmentId?: number | string
  /** 배정 면접일 YYYY-MM-DD (KST) */
  assignedInterviewDate?: string
  /** 활성 면접 슬롯 start_at 시각 (ISO LocalTime, 예: 10:00:00, KST) */
  assignedInterviewTime?: string
  /** 현재 면접 배정 score 합 정확 일치 (`totalScoreUnevaluated`와 동시 전송 불가) */
  totalScore?: number
  /** 총점 미평가 — 유효 score_total 제출 평가자 2명 미만 (`totalScore`와 동시 전송 불가) */
  totalScoreUnevaluated?: boolean
}

/** GET …/organization-applications — OpenAPI `OrganizationApplications1Params` + 공통 page query */
export type OrganizationApplicationsListQuery = ApplicationsListQuery &
  Omit<OrganizationApplications1Params, 'recruitmentId'> & {
    /** UJAT 임시 배정 워크플로. applicationStatus `status`와 별개 */
    temporaryAssignmentStatus?: string
  }

const generalApplicationsDashboardApi = getJAKoreaCMSBackendAPIDashboardSubset()

export interface ApplicationsPageDto<T> {
  items?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

/** Spring Page `content` vs CMS OpenAPI `items` — 목록 adapter 공통 */
export function normalizeApplicationsPageDto<T>(
  body: ApplicationsPageDto<T> & { content?: T[] }
): ApplicationsPageDto<T> {
  const items = body.items ?? body.content ?? []
  return { ...body, items }
}

export type IndividualApplicationNotificationResendRequest = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt: string | null
  reason: string | null
}

/** OpenAPI `Notification` — 강사 신청 승인/반려/취소/재발송 공통 */
export type InstructorApplicationNotificationRequest = {
  timing: 'IMMEDIATE' | 'SCHEDULED' | string
  scheduledAt?: string | null
}

/** OpenAPI `FeePolicy` */
export type InstructorApplicationFeePolicyRequest = {
  basisType: string
  measure: string
  amount: number
  instructorFeeGrade: string
}

/** OpenAPI `Assignment` */
export type InstructorApplicationAssignmentRequest = {
  scheduleId: number
  organizationApplicationId?: number
  scheduleLead?: boolean
}

/** OpenAPI `Approval` */
export type InstructorApplicationApprovalRequest = {
  assignments?: InstructorApplicationAssignmentRequest[]
  feePolicy?: InstructorApplicationFeePolicyRequest
  notification?: InstructorApplicationNotificationRequest
}

/** OpenAPI `Rejection` / `Cancellation` */
export type InstructorApplicationDecisionWithReasonRequest = {
  reason: string
  notification?: InstructorApplicationNotificationRequest
}

/** OpenAPI `ApprovalCancellation` + CMS faultParty overlay (`InstructorApplicationApprovalCancellationRequest`) */
export type InstructorApplicationApprovalCancellationRequest = {
  reason: string
  notification?: InstructorApplicationNotificationRequest
  faultParty?: 'USER' | 'ADMIN' | null
}

export type { IndividualApprovalWithScopeResult }

export type InstructorApplicationUpdatePayload = {
  managerComment?: string | null
  feePolicy?: InstructorApplicationFeePolicyRequest | null
  /** 생략=기존 신청값 유지, null=명시적 초기화(회원 프로필 fallback). 빈 문자열 금지 */
  businessIncomeEarnerStatus?: '해당' | '해당 없음' | null
}

/** 기관 승인·반려 / 강사 일괄 — generated BulkDecisionRequest의 평탄 timing 필드. */
export type OrganizationDecisionNotifyRequest = Pick<
  BulkDecisionRequest,
  'timing' | 'scheduledAt'
>

/** OpenAPI `SlotRequest` — 레거시 slots 호환 입력 */
export type OrganizationApplicationApproveSlotRequest = SlotRequest

/**
 * OpenAPI `OrganizationApplicationApproveRequest` + 희망 일정 행 id.
 * `requestedScheduleIds`는 BE 신규 필드(GENERAL_ORGANIZATION + PERIOD). 저장소 OpenAPI 미동기화라 수동 반영.
 */
export type OrganizationApplicationApprovePayload = OrganizationApplicationApproveRequest & {
  /** program_application_requested_schedule.id 목록. [] 또는 생략 = 일정 미확정 승인. */
  requestedScheduleIds?: number[]
  requestedScheduleId?: number
  /** TRAINED_TEACHER + PERIOD에서 서버가 내려준 희망 순위. scheduleId가 아니다. */
  preferredScheduleRank?: number
}

/** 기관·봉사자 취소 — 중첩 notification. reason만 있으면 즉시. */
export type ApplicationDecisionCancelRequestWithNotification = Omit<
  ApplicationDecisionCancelRequest,
  'notification'
> & {
  notification?: InstructorApplicationNotificationRequest
}

export type ScreeningResultNotifyFields = {
  notifyTiming?: string
  scheduledAt?: string
}

function sanitizeScreeningResultPayload<T extends ScreeningResultNotifyFields>(payload: T): T {
  const { scheduledAt, ...rest } = payload
  return {
    ...rest,
    ...(payload.notifyTiming === 'MANUAL' && scheduledAt ? { scheduledAt } : {}),
  } as T
}

function positiveAssignmentId(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return undefined
  return Math.trunc(value)
}

function sanitizeInterviewAssignmentPayload<
  T extends {
    notifyTiming?: string | null
    scheduledAt?: string | null
    volunteerApplicationId?: number | null
    individualApplicationId?: number | null
    interviewSlotId?: number | null
  },
>(payload: T): T {
  const {
    scheduledAt,
    volunteerApplicationId,
    individualApplicationId,
    interviewSlotId,
    ...rest
  } = payload
  const volunteerId = positiveAssignmentId(volunteerApplicationId)
  const individualId = positiveAssignmentId(individualApplicationId)
  const slotId = positiveAssignmentId(interviewSlotId)
  return {
    ...rest,
    ...(volunteerId != null && individualId == null ? { volunteerApplicationId: volunteerId } : {}),
    ...(individualId != null && volunteerId == null ? { individualApplicationId: individualId } : {}),
    ...(slotId != null ? { interviewSlotId: slotId } : {}),
    ...(payload.notifyTiming === 'MANUAL' && scheduledAt ? { scheduledAt } : {}),
  } as T
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
  params?: ApplicationsListQuery | OrganizationApplicationsListQuery
): Promise<ApplicationsPageDto<T>> {
  const body = unwrapApiBody<ApplicationsPageDto<T> & { content?: T[] }>(
    await customInstance({
      url,
      method: 'GET',
      params,
    })
  )
  return normalizeApplicationsPageDto(body)
}

export async function fetchOrganizationApplicationsRemote(
  programId: string,
  params?: OrganizationApplicationsListQuery
): Promise<ApplicationsPageDto<OrganizationApplicationListItemResponse>> {
  return fetchApplicationsPage<OrganizationApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/organization-applications`,
    params
  )
}

/**
 * 기관 신청 상세 — OpenAPI `OrganizationApplicationDetailResponse` +
 * UJAT hydrate용 보조 필드(목록·레거시 호환).
 *
 * snackAvailability / sexOffenseCheckRequest / leftoverTextbookDisposal 는
 * OpenAPI detail 프로젝션 필드(SSOT). form-response·local fallback 없음.
 */
export type OrganizationApplicationDetailDto = OrganizationApplicationDetailResponse & {
  managerComment?: string | null
  regionSido?: string | null
  regionSigungu?: string | null
  grade?: string | null
  /** 기관 확인 후 일정 수정 잠금 시각. 없으면 null. */
  assignmentLockedAt?: string | null
  /** Portal 일정 협의 배너. 관리자 버튼은 상태 필드가 우선이다. */
  portalBannerState?: string | null
}

export async function fetchOrganizationApplicationDetailRemote(
  applicationId: string
): Promise<OrganizationApplicationDetailDto> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

/** BE PATCH accepts null to clear teacher contact fields; generated OpenAPI type omits null. */
export type OrganizationApplicationUpdateWire = Omit<
  OrganizationApplicationUpdateRequest,
  'teacherTel' | 'teacherPhone' | 'teacherEmail'
> & {
  teacherTel?: string | null
  teacherPhone?: string | null
  teacherEmail?: string | null
}

export async function updateOrganizationApplicationRemote(
  applicationId: string,
  payload: OrganizationApplicationUpdateWire
): Promise<OrganizationApplicationDetailResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}`,
      method: 'PATCH',
      data: payload,
    })
  )
}

/** OpenAPI operationId: unmaskOrganizationApplicationDetail */
export async function unmaskOrganizationApplicationPrivacyRemote(
  applicationId: string,
  reason: string,
  programId?: number,
  options?: PrivacyRevealOptions
): Promise<OrganizationApplicationDetailResponse> {
  return unwrapApiBody<OrganizationApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/privacy/unmask`,
      method: 'POST',
      // purpose=EDIT_MODE는 수정 진입 호출부가 명시할 때만 — 서버가 APPLICATION_WRITE 확인·고정 사유 감사
      data: privacyUnmaskBody(reason, { programId, purpose: options?.purpose }),
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

/** OpenAPI operationId: unmaskInstructorApplicationDetail */
export async function unmaskInstructorApplicationPrivacyRemote(
  applicationId: string,
  reason: string,
  programId?: number,
  options?: PrivacyRevealOptions
): Promise<InstructorApplicationDetailResponse> {
  return unwrapApiBody<InstructorApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/privacy/unmask`,
      method: 'POST',
      // purpose=EDIT_MODE는 수정 진입 호출부가 명시할 때만 — 서버가 APPLICATION_WRITE 확인·고정 사유 감사
      data: privacyUnmaskBody(reason, { programId, purpose: options?.purpose }),
      headers: { 'Cache-Control': 'no-store' },
    })
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

export async function fetchInstructorApplicationDetailRemote(
  applicationId: string
): Promise<InstructorApplicationDetailResponse> {
  return unwrapApiBody<InstructorApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

export async function updateInstructorApplication(
  applicationId: string,
  payload: InstructorApplicationUpdatePayload
): Promise<InstructorApplicationDetailResponse> {
  return unwrapApiBody<InstructorApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}`,
      method: 'PATCH',
      data: payload,
    })
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
  reason: string,
  options?: PrivacyRevealOptions
): Promise<IndividualApplicationDetailResponse> {
  return unwrapApiBody<IndividualApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/privacy/unmask`,
      method: 'POST',
      data: privacyUnmaskBody(reason, { purpose: options?.purpose }),
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

export async function updateVolunteerDocumentEvaluationRemote(
  applicationId: string,
  managerSlot: 'A' | 'B',
  payload: VolunteerDocumentEvaluationRequest
): Promise<VolunteerDocumentEvaluationResponse> {
  const numericApplicationId = Number(applicationId)
  if (!Number.isSafeInteger(numericApplicationId)) {
    throw new Error('봉사자 신청 ID가 올바르지 않습니다.')
  }
  return generalApplicationsDashboardApi.recordVolunteerDocumentEvaluation(
    numericApplicationId,
    managerSlot,
    payload
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

export async function fetchVolunteerApplicationDetailRemote(
  applicationId: string
): Promise<VolunteerApplicationDetailResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

/**
 * 봉사자 희망 교육 활동 지역 수정.
 * OpenAPI operationId: `updateVolunteerApplicationActivityRegion`
 */
export async function patchVolunteerApplicationActivityRegionRemote(
  applicationId: string,
  payload: VolunteerActivityRegionUpdateRequest
): Promise<VolunteerActivityRegionUpdateResponse> {
  const numericApplicationId = Number(applicationId)
  if (!Number.isSafeInteger(numericApplicationId) || numericApplicationId <= 0) {
    throw new Error('봉사자 신청 ID가 올바르지 않습니다.')
  }
  return unwrapApiBody<VolunteerActivityRegionUpdateResponse>(
    await generalApplicationsDashboardApi.updateVolunteerApplicationActivityRegion(
      numericApplicationId,
      payload
    )
  )
}

/** OpenAPI operationId: unmaskVolunteerApplicationDetail */
export async function unmaskVolunteerApplicationPrivacyRemote(
  applicationId: string,
  reason: string,
  programId?: number,
  options?: PrivacyRevealOptions
): Promise<VolunteerApplicationDetailResponse> {
  return unwrapApiBody<VolunteerApplicationDetailResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/privacy/unmask`,
      method: 'POST',
      // purpose=EDIT_MODE는 수정 진입 호출부가 명시할 때만 — 서버가 APPLICATION_WRITE 확인·고정 사유 감사
      data: privacyUnmaskBody(reason, { programId, purpose: options?.purpose }),
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

/** OpenAPI operationId: cancelVolunteerDocumentApproval */
export async function cancelVolunteerApplicationApprovalRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/cancel-approval`,
      method: 'POST',
      data: payload,
    })
  )
}

/** OpenAPI operationId: cancelVolunteerDocumentRejection */
export async function cancelVolunteerApplicationRejectionRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/cancel-rejection`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function approveOrganizationApplicationRemote(
  applicationId: string,
  payload?: OrganizationApplicationApprovePayload
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
      ...(payload ? { data: payload } : {}),
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

export async function cancelOrganizationApplicationApprovalRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/cancel-approval`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelOrganizationApplicationRejectionRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/cancel-rejection`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function approveInstructorApplicationRemote(
  applicationId: string,
  payload?: InstructorApplicationApprovalRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
      ...(payload ? { data: payload } : {}),
    })
  )
}

export async function rejectInstructorApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest | InstructorApplicationDecisionWithReasonRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelInstructorApplicationApprovalRemote(
  applicationId: string,
  payload: InstructorApplicationApprovalCancellationRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/cancel-approval`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelInstructorApplicationRejectionRemote(
  applicationId: string,
  payload: InstructorApplicationDecisionWithReasonRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/cancel-rejection`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function resendInstructorApplicationNotification(
  applicationId: string,
  payload: InstructorApplicationNotificationRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/notifications/resend`,
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

/** POST /api/admin/organization-applications/bulk-approve */
export async function bulkApproveOrganizationApplicationsRemote(
  ids: number[],
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  const body: TimedBulkIdsRequest = {
    ids,
    ...(notify?.timing ? { timing: notify.timing } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/bulk-approve`,
      method: 'POST',
      data: body,
    })
  )
}

/** POST /api/admin/organization-applications/bulk-reject */
export async function bulkRejectOrganizationApplicationsRemote(
  ids: number[],
  reason: string,
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  const body: BulkDecisionRequest = {
    ids,
    reason,
    ...(notify?.timing ? { timing: notify.timing } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/bulk-reject`,
      method: 'POST',
      data: body,
    })
  )
}

/** POST /api/admin/instructor-applications/bulk-approve */
export async function bulkApproveInstructorApplicationsRemote(
  ids: number[],
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  const body: TimedBulkIdsRequest = {
    ids,
    ...(notify?.timing ? { timing: notify.timing } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
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
  reason: string,
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  const body: BulkDecisionRequest = {
    ids,
    reason,
    ...(notify?.timing ? { timing: notify.timing } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
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

/**
 * POST /api/admin/individual-applications/{applicationId}/approve-with-education-scope
 * operationId: approve_2
 * GENERAL_INDIVIDUAL 최종 승인은 이 경로만 사용한다.
 */
export async function approveIndividualApplicationWithEducationScopeRemote(
  applicationId: string,
  payload: IndividualApprovalWithScopeRequest
): Promise<IndividualApprovalWithScopeResult> {
  return unwrapApiBody<IndividualApprovalWithScopeResult>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/approve-with-education-scope`,
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * POST /api/admin/individual-applications/bulk-approve-with-education-scope
 * operationId: approve_3
 *
 * 실행 중 OpenAPI의 targets.items는 계정 Target(accountType, id)을 가리킨다.
 * 신청별 일정 필드는 기존 generated IndividualApprovalWithScopeBulkTarget
 * (applicationId, confirmedScheduleIds, expectedScopeRevision)을 그대로 보낸다.
 */
export async function bulkApproveIndividualApplicationsWithEducationScopeRemote(payload: {
  reason: string
  targets: IndividualApprovalWithScopeBulkTarget[]
} & OrganizationDecisionNotifyRequest): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/individual-applications/bulk-approve-with-education-scope',
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * POST /api/admin/volunteer-applications/{applicationId}/approve-with-education-scope
 * 면접 없는 봉사자 최종 합격. confirmedScheduleIds는 본교육 ID만(사전교육은 서버가 붙임).
 */
export async function approveVolunteerApplicationWithEducationScopeRemote(
  applicationId: string,
  payload: IndividualApprovalWithScopeRequest
): Promise<IndividualApprovalWithScopeResult> {
  return unwrapApiBody<IndividualApprovalWithScopeResult>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/approve-with-education-scope`,
      method: 'POST',
      data: payload,
    })
  )
}

/**
 * POST /api/admin/volunteer-applications/bulk-approve-with-education-scope
 * 면접 없는 봉사자 일괄 합격. target.confirmedScheduleIds는 본교육 ID만.
 */
export async function bulkApproveVolunteerApplicationsWithEducationScopeRemote(payload: {
  reason: string
  targets: IndividualApprovalWithScopeBulkTarget[]
} & OrganizationDecisionNotifyRequest): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/volunteer-applications/bulk-approve-with-education-scope',
      method: 'POST',
      data: payload,
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

export async function bulkRejectIndividualApplicationsRemote(
  ids: number[],
  reason: string,
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  const body: BulkDecisionRequest = {
    ids,
    reason,
    ...(notify?.timing ? { timing: notify.timing } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/individual-applications/bulk-reject',
      method: 'POST',
      data: body,
    })
  )
}

export async function cancelIndividualApplicationRejectionRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/cancel-rejection`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelIndividualApplicationApprovalRemote(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/cancel-approval`,
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
 * POST /api/admin/individual-applications/{applicationId}/document-results/notifications/resend
 * 서류 합격/불합격 알림만 재enqueue. 신청 결과 notifications/resend와 분리.
 */
export async function resendIndividualDocumentResultNotification(
  applicationId: string,
  payload: OrganizationApplicationNotificationResendRequest,
  idempotencyKey: string
): Promise<ApplicationDecisionResponse> {
  const body: OrganizationApplicationNotificationResendRequestDto = {
    timing: payload.timing,
    ...(payload.scheduledAt != null ? { scheduledAt: payload.scheduledAt } : {}),
    ...(payload.reason != null ? { reason: payload.reason } : {}),
  }
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/document-results/notifications/resend`,
      method: 'POST',
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    })
  )
}

/** OpenAPI `OrganizationApplicationNotificationResendRequest` — FE는 IMMEDIATE|SCHEDULED + nullables를 명시적으로 전송 */
export type OrganizationApplicationNotificationResendRequest = {
  timing: OrganizationApplicationNotificationResendRequestTiming
  scheduledAt: string | null
  reason: string | null
}

/**
 * OpenAPI operationId: resendOrganizationApplicationNotification
 * Idempotency-Key는 Orval 생성 함수 options로 전달 (헤더 병합).
 * @see JABACK docs/frontend/general-organization-notification-resend-frontend-handoff-2026-09-27.md
 */
export async function resendOrganizationApplicationNotification(
  applicationId: string,
  payload: OrganizationApplicationNotificationResendRequest,
  idempotencyKey: string
): Promise<ApplicationDecisionResponse> {
  const numericId = Number(applicationId)
  if (!Number.isFinite(numericId)) {
    throw new Error('기관 신청 ID를 확인할 수 없습니다.')
  }
  const body: OrganizationApplicationNotificationResendRequestDto = {
    timing: payload.timing,
    ...(payload.scheduledAt != null ? { scheduledAt: payload.scheduledAt } : {}),
    ...(payload.reason != null ? { reason: payload.reason } : {}),
  }
  return unwrapApiBody<ApplicationDecisionResponse>(
    await generalApplicationsDashboardApi.resendOrganizationApplicationNotification(
      numericId,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
      }
    )
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
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/give-up`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function giveUpVolunteerApplicationRemote(
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/give-up`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitIndividualDocumentResultRemote(
  applicationId: string,
  payload: DocumentResultRequest & ScreeningResultNotifyFields
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/document-result`,
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

export async function submitIndividualFinalResultRemote(
  applicationId: string,
  payload: VolunteerFinalResultRequest & ScreeningResultNotifyFields
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/final-result`,
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

/**
 * POST /api/admin/volunteer-applications/{applicationId}/document-results/notifications/resend
 * 서류 합격/불합격 알림만 재enqueue. documentStatus는 바꾸지 않는다.
 */
export async function resendVolunteerDocumentResultNotification(
  applicationId: string,
  payload: OrganizationApplicationNotificationResendRequest,
  idempotencyKey: string
): Promise<ApplicationDecisionResponse> {
  const body: OrganizationApplicationNotificationResendRequestDto = {
    timing: payload.timing,
    ...(payload.scheduledAt != null ? { scheduledAt: payload.scheduledAt } : {}),
    ...(payload.reason != null ? { reason: payload.reason } : {}),
  }
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/document-results/notifications/resend`,
      method: 'POST',
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    })
  )
}

export async function submitVolunteerDocumentResultRemote(
  applicationId: string,
  payload: DocumentResultRequest & ScreeningResultNotifyFields
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/document-result`,
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

/** POST /api/admin/volunteer-applications/document-results/bulk */
export async function bulkVolunteerDocumentResultsRemote(
  payload: BulkResultRequest & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/volunteer-applications/document-results/bulk',
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

export async function bulkIndividualDocumentResultsRemote(
  payload: BulkResultRequest & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/individual-applications/document-results/bulk',
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

export async function submitVolunteerFinalResultRemote(
  applicationId: string,
  payload: VolunteerFinalResultRequest & ScreeningResultNotifyFields
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/final-result`,
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

/** POST /api/admin/volunteer-applications/final-results/bulk */
export async function bulkVolunteerFinalResultsRemote(
  payload: BulkResultRequest & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  return unwrapApiBody<BulkActionResponse>(
    await customInstance({
      url: '/api/admin/volunteer-applications/final-results/bulk',
      method: 'POST',
      data: sanitizeScreeningResultPayload(payload),
    })
  )
}

/** 담당자 A·B는 각 0~5. 마스터·해당 프로그램 PM만 A·B를 한 번에 보낼 수 있다. */
export type InterviewAssignmentEvaluationPayload =
  import('@/shared/api/generated/dashboard/schemas/interviewEvaluationRequest').InterviewEvaluationRequest

/** POST /api/admin/interview-assignments/{assignmentId}/evaluations */
export async function submitInterviewAssignmentEvaluationRemote(
  assignmentId: string | number,
  payload: InterviewAssignmentEvaluationPayload
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
      data: sanitizeInterviewAssignmentPayload(payload),
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

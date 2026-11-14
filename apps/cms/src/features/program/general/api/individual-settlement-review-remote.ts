import { queryOptions } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { customInstance } from '@/shared/api/orval-mutator'
import { postEncryptedAdminFile } from '@/shared/lib/post-encrypted-admin-file'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'
import type { SettlementApplicationDocumentResponse } from '@/shared/api/generated/settlement/schemas'
import type { ApiResponseIndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDecision'
import type { ApiResponseIndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDetail'
import type { IndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDecision'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewRequest } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewRequest'
import type { SettlementStatusChangeRequestNotificationType } from '@/shared/api/generated/settlement/schemas/settlementStatusChangeRequestNotificationType'
import type { PageResponseIndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/pageResponseIndividualSettlementReviewListItem'
import type {
  IndividualSettlementReviewApplicationType,
  IndividualSettlementReviewDetailView,
  IndividualSettlementReviewListItemView,
} from '@/features/program/general/api/individual-settlement-review-types'

export const INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL =
  '/api/admin/individual-settlement-applications'

export function individualSettlementReviewDetailUrl(settlementApplicationId: number): string {
  return `${INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL}/${settlementApplicationId}`
}

export function individualSettlementReviewApproveUrl(settlementApplicationId: number): string {
  return `${individualSettlementReviewDetailUrl(settlementApplicationId)}/approve`
}

export function individualSettlementReviewRejectUrl(settlementApplicationId: number): string {
  return `${individualSettlementReviewDetailUrl(settlementApplicationId)}/reject`
}

/** 영수증 정산 「JA KOREA 정산 신청서」 조회 — GET, ApiResponse 래퍼(포털과 다름) */
export function individualSettlementApplicationDocumentUrl(settlementApplicationId: number): string {
  return `${individualSettlementReviewDetailUrl(settlementApplicationId)}/application-document`
}

/** 영수증 정산 「JA KOREA 정산 신청서」 암호 PDF — POST { password }, 래퍼 없이 PDF 바이트 */
export function individualSettlementApplicationDocumentDownloadUrl(
  settlementApplicationId: number,
  revisionNo?: number
): string {
  const base = `${individualSettlementApplicationDocumentUrl(settlementApplicationId)}/download`
  return revisionNo != null ? `${base}?revisionNo=${revisionNo}` : base
}

export function parseIndividualSettlementNumericId(
  value: string | number | undefined | null
): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export function buildIndividualSettlementReviewListParams(input: {
  programId?: string | number | null
  participantId?: string | number | null
  page?: number
  size?: number
  status?: string
  /** 생략하면 참여자·봉사자 모두 */
  applicationType?: IndividualSettlementReviewApplicationType
}): {
  page: number
  size: number
  programId?: number
  participantId?: number
  status?: string
  applicationType?: IndividualSettlementReviewApplicationType
} {
  const params: {
    page: number
    size: number
    programId?: number
    participantId?: number
    status?: string
    applicationType?: IndividualSettlementReviewApplicationType
  } = {
    page: input.page ?? 0,
    size: input.size ?? 100,
  }
  const programId = parseIndividualSettlementNumericId(input.programId)
  const participantId = parseIndividualSettlementNumericId(input.participantId)
  if (programId != null) params.programId = programId
  if (participantId != null) params.participantId = participantId
  const status = input.status?.trim()
  if (status) params.status = status
  if (input.applicationType) params.applicationType = input.applicationType
  return params
}

export function unwrapIndividualSettlementReviewListPage(
  payload: unknown
): PageResponseIndividualSettlementReviewListItem {
  const body = unwrapApiBody<PageResponseIndividualSettlementReviewListItem>(payload)
  if (body == null || typeof body !== 'object') {
    return { items: [] }
  }
  return {
    items: Array.isArray(body.items) ? body.items : [],
    page: body.page,
    size: body.size,
    totalElements: body.totalElements,
    totalPages: body.totalPages,
  }
}

export function unwrapIndividualSettlementReviewDetail(
  payload: unknown
): IndividualSettlementReviewDetail {
  const wrapped = payload as ApiResponseIndividualSettlementReviewDetail | IndividualSettlementReviewDetail
  if (
    wrapped != null &&
    typeof wrapped === 'object' &&
    'success' in wrapped &&
    (wrapped as ApiResponseIndividualSettlementReviewDetail).success === true &&
    'data' in wrapped
  ) {
    return unwrapApiBody<IndividualSettlementReviewDetail>(wrapped)
  }
  return unwrapApiBody<IndividualSettlementReviewDetail>(payload)
}

export function unwrapIndividualSettlementReviewDecision(
  payload: unknown
): IndividualSettlementReviewDecision {
  const wrapped = payload as ApiResponseIndividualSettlementReviewDecision | IndividualSettlementReviewDecision
  if (
    wrapped != null &&
    typeof wrapped === 'object' &&
    'success' in wrapped &&
    (wrapped as ApiResponseIndividualSettlementReviewDecision).success === true &&
    'data' in wrapped
  ) {
    return unwrapApiBody<IndividualSettlementReviewDecision>(wrapped)
  }
  return unwrapApiBody<IndividualSettlementReviewDecision>(payload)
}

export function isIndividualSettlementReviewConflict(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 409
}

export async function fetchIndividualSettlementReviewListRemote(input: {
  programId?: string | number | null
  participantId?: string | number | null
  page?: number
  size?: number
  status?: string
  applicationType?: IndividualSettlementReviewApplicationType
} = {}): Promise<IndividualSettlementReviewListItemView[]> {
  const params = buildIndividualSettlementReviewListParams(input)
  const response = await customInstance<unknown>({
    url: INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
    method: 'GET',
    params,
  })
  const page = unwrapIndividualSettlementReviewListPage(response)
  return Array.isArray(page.items) ? page.items : []
}

export async function fetchIndividualSettlementReviewDetailRemote(
  settlementApplicationId: number
): Promise<IndividualSettlementReviewDetailView> {
  const response = await customInstance<unknown>({
    url: individualSettlementReviewDetailUrl(settlementApplicationId),
    method: 'GET',
  })
  return unwrapIndividualSettlementReviewDetail(response)
}

/**
 * 관리자 영수증 정산 신청서 문서(제출 스냅샷) — documentType=RECEIPT_SETTLEMENT.
 * 관리자 GET은 ApiResponse.data로 감싸 온다(포털 GET은 래퍼 없음). attachments는 항상 [].
 * SUBMITTED·APPROVED·REJECTED revision 조회 가능, 그 외 404.
 */
export async function fetchIndividualSettlementApplicationDocumentRemote(
  settlementApplicationId: number,
  revisionNo?: number
): Promise<SettlementApplicationDocumentResponse> {
  const response = await customInstance<unknown>({
    url: individualSettlementApplicationDocumentUrl(settlementApplicationId),
    method: 'GET',
    ...(revisionNo != null ? { params: { revisionNo } } : {}),
  })
  return unwrapApiBody<SettlementApplicationDocumentResponse>(response)
}

/**
 * 영수증 정산 신청서 암호 PDF 다운로드 — 승인(APPROVED) revision만 허용, 그 외 409
 * SETTLEMENT_APPLICATION_DOCUMENT_NOT_APPROVED. 다운로드 로그는 BE가 남긴다.
 */
export async function downloadIndividualSettlementApplicationDocumentRemote(
  settlementApplicationId: number,
  options: { password: string; revisionNo?: number }
): Promise<void> {
  await postEncryptedAdminFile({
    url: individualSettlementApplicationDocumentDownloadUrl(
      settlementApplicationId,
      options.revisionNo
    ),
    password: options.password,
    // 서버 Content-Disposition(`[JA Korea] 정산 신청서_{성명}_{제출일}.pdf`)을 우선 쓴다. 헤더를 못 읽을 때만 사용.
    fallbackFileName: `[JA Korea] 정산 신청서_${settlementApplicationId}_${formatAsiaSeoulYymmdd()}.pdf`,
  })
}

export async function approveIndividualSettlementReviewRemote(input: {
  settlementApplicationId: number
  expectedRevisionNo: number
  /**
   * 「지급조서 확인 안내」에서 고른 계좌 지급 예정일(YYYY-MM-DD, KST 오늘 이후). 필수(A1·A2).
   * 승인하면 계좌 지급 건(sourceType=INDIVIDUAL_SETTLEMENT, WAITING_PAYMENT)이 만들어진다.
   * 누락 400 SCHEDULED_PAYMENT_DATE_REQUIRED, 오늘 이전 400 SCHEDULED_PAYMENT_DATE_MUST_BE_TODAY_OR_LATER.
   */
  scheduledPaymentDate: string
}): Promise<IndividualSettlementReviewDecision> {
  const body: IndividualSettlementReviewRequest & { scheduledPaymentDate: string } = {
    expectedRevisionNo: input.expectedRevisionNo,
    scheduledPaymentDate: input.scheduledPaymentDate,
  }
  const response = await customInstance<unknown>({
    url: individualSettlementReviewApproveUrl(input.settlementApplicationId),
    method: 'PATCH',
    data: body,
  })
  return unwrapIndividualSettlementReviewDecision(response)
}

export async function rejectIndividualSettlementReviewRemote(input: {
  settlementApplicationId: number
  expectedRevisionNo: number
  reason: string
  notificationType?: SettlementStatusChangeRequestNotificationType
  scheduledNotificationAt?: string
}): Promise<IndividualSettlementReviewDecision> {
  const reason = input.reason.trim()
  const body: IndividualSettlementReviewRequest & {
    notificationType?: SettlementStatusChangeRequestNotificationType
    scheduledNotificationAt?: string
  } = {
    expectedRevisionNo: input.expectedRevisionNo,
    reason,
  }
  if (input.notificationType) body.notificationType = input.notificationType
  if (input.scheduledNotificationAt) body.scheduledNotificationAt = input.scheduledNotificationAt
  const response = await customInstance<unknown>({
    url: individualSettlementReviewRejectUrl(input.settlementApplicationId),
    method: 'PATCH',
    data: body,
  })
  return unwrapIndividualSettlementReviewDecision(response)
}

export function individualSettlementReviewListQueryOptions(input: {
  programId: string
  participantId: string
  applicationType?: IndividualSettlementReviewApplicationType
}) {
  return queryOptions({
    queryKey: [
      ...generalProgramProgressQueryKeys.individualSettlementReviews(
        input.programId,
        input.participantId
      ),
      input.applicationType ?? 'ALL',
    ] as const,
    staleTime: 30_000,
    queryFn: () =>
      fetchIndividualSettlementReviewListRemote({
        programId: input.programId,
        participantId: input.participantId,
        applicationType: input.applicationType,
      }),
  })
}

export function individualSettlementReviewDetailQueryOptions(settlementApplicationId: number) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.individualSettlementReviewDetail(
      settlementApplicationId
    ),
    staleTime: 30_000,
    queryFn: () => fetchIndividualSettlementReviewDetailRemote(settlementApplicationId),
  })
}

export function isIndividualSettlementReviewRemoteEnabled(): boolean {
  return isRemoteApiConfigured() && hasRemoteAdminJwt()
}

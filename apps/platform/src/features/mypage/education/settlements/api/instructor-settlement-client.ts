import { axiosClient } from '@/shared/api/axios-instance'
import type {
  InstructorSettlementCreateRequest,
  InstructorSettlementResubmitRequest,
} from '../lib/build-instructor-settlement-submit.ts'
import type { PaymentStatementCorrectionDetail } from '../lib/payment-statement-correction.ts'

export type PortalInstructorSettlementApplication = {
  applicationId?: number
  applicationNo?: string | null
  assignmentId?: number | null
  programId?: number | null
  programScheduleId?: number | null
  instructorMemberId?: number | null
  lectureReportId?: number | null
  formResponseId?: number | null
  status?: string | null
  revisionNo?: number | null
  grossAmount?: number | null
  deductionAmount?: number | null
  withholdingTaxAmount?: number | null
  netPaymentAmount?: number | null
  submittedAt?: string | null
  createdAt?: string | null
  availableActions?: string[]
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

/** POST /api/portal/me/settlement-applications — 강사 지급조서 최초 제출 */
export async function createInstructorSettlementApplication(
  body: InstructorSettlementCreateRequest,
): Promise<PortalInstructorSettlementApplication> {
  const { data } = await axiosClient.post<unknown>('/api/portal/me/settlement-applications', body)
  return unwrapEnvelope<PortalInstructorSettlementApplication>(data)
}

/**
 * POST /api/portal/me/instructor-assignments/{assignmentId}/settlement-applications/preview
 * 교통비 제외 사유(transportationExcludedReason)·주소 쪽(transportationUnresolvedAddressSide)만 쓴다.
 */
export type PortalInstructorSettlementPreview = {
  assignmentId?: number | null
  canSubmit?: boolean
  blockerCode?: string | null
  transportationExcludedReason?: string | null
  transportationUnresolvedAddressSide?: string | null
}

export async function previewInstructorSettlementApplication(
  assignmentId: number,
  signal?: AbortSignal,
): Promise<PortalInstructorSettlementPreview> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/instructor-assignments/${assignmentId}/settlement-applications/preview`,
    { requestedItems: [] },
    { signal },
  )
  return unwrapEnvelope<PortalInstructorSettlementPreview>(data)
}

/** POST /api/portal/me/settlement-applications/{applicationId}/revisions */
export async function resubmitInstructorSettlementApplication(
  settlementApplicationId: number,
  body: InstructorSettlementResubmitRequest,
): Promise<PortalInstructorSettlementApplication> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/settlement-applications/${settlementApplicationId}/revisions`,
    body,
  )
  return unwrapEnvelope<PortalInstructorSettlementApplication>(data)
}

export type PortalSettlementStatusChange = {
  settlementId?: number
  statusAxis?: string
  toStatus?: string
}

/**
 * POST /api/portal/me/settlements/{settlementId}/payment-statement/reapply (reapplyCorrectedPaymentStatement)
 * 정정 승인으로 만들어진 최신 revision(DRAFT)만 가능. 아니면 409 SETTLEMENT_REAPPLICATION_NOT_AVAILABLE.
 */
/** GET /api/portal/me/settlements/{settlementId}/payment-statement/correction — 정정 전·후 비교 (getPaymentStatementCorrectionDetail) */
export async function fetchPaymentStatementCorrectionDetail(
  settlementId: number,
  signal?: AbortSignal,
): Promise<PaymentStatementCorrectionDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/settlements/${settlementId}/payment-statement/correction`,
    { signal },
  )
  return unwrapEnvelope<PaymentStatementCorrectionDetail>(data)
}

export async function reapplyCorrectedPaymentStatement(
  settlementId: number,
): Promise<PortalSettlementStatusChange> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/settlements/${settlementId}/payment-statement/reapply`,
  )
  return unwrapEnvelope<PortalSettlementStatusChange>(data)
}

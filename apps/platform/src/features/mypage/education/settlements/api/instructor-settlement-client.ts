import { axiosClient } from '@/shared/api/axios-instance'
import type {
  InstructorSettlementCreateRequest,
  InstructorSettlementResubmitRequest,
} from '../lib/build-instructor-settlement-submit.ts'

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

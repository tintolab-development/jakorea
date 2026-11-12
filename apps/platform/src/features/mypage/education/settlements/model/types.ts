import type { InstructorTransportPreview } from '../lib/instructor-transport-preview'
import type { LectureFeePreview } from '../lib/lecture-fee-preview'

export type { LectureFeePreview }

export type EducationSettlementProgress = 'completed' | 'upcoming'

export type EducationSettlementStatus =
  | 'report_pending'
  | 'pending_submit'
  | 'overdue'
  | 'waiting_confirm'
  | 'reapplied'
  | 'confirmed'
  | 'paid'
  | 'rejected'
  | 'correction_requested'
  | 'correction_completed'
  | 'upcoming'
  | 'unresolved'

export type SettlementDeadlineNotice = 'overdue' | 'operation_ended'

export type EducationSettlementItem = {
  id: string
  scheduleId?: number | null
  /** 강사 배정 ID. lecture-report-assignments.assignmentId */
  assignmentId?: number | null
  /** 회차 번호(sessionNo, 없으면 서버 순서 1-based). 인정 차시·커리큘럼 차시가 아니다. */
  sessionNumber: number
  /** Gemini 정산 인정 차시(recognizedClassCount). 회차·커리큘럼 차시와 별개. */
  recognizedClassCount?: number
  heldAt: string
  /** 예: `10:00~11:20 3회차`, Gemini `10:00~11:20 3차시`(인정 차시) */
  sessionMeta: string
  /** 배정 학교·기관명. API에 값이 있을 때만 채운다. */
  institutionLabel?: string
  /** 학교·기관명. 강의보고서 뱃지 `primary` */
  institutionName?: string
  /** 학년. 강의보고서 뱃지 `secondary` */
  grade?: string
  /** 강의 시작. lecture-report-assignments.startAt */
  lectureStartAt?: string | null
  /** 강의 종료. lecture-report-assignments.endAt */
  lectureEndAt?: string | null
  /** 지급조서 확인 강사비 산출. 조인된 배정에만. 없으면 null */
  lectureFeePreview?: LectureFeePreview | null
  /** 강사 교통비 자동 산출. 서버 미리보기만. 없으면 null */
  instructorTransportPreview?: InstructorTransportPreview | null
  progress: EducationSettlementProgress
  status: EducationSettlementStatus
  deadlineAt?: string
  submittedAt?: string
  deadlineLabel?: string
  amount?: number
  rejectReason?: string
  settlementApplicationId?: number
  /** 강사 지급조서: 최신 정산 revision ID (재신청 API 경로). 정산 전이면 없음 */
  settlementId?: number
  receiptId?: number
  currentRevisionNo?: number
  canSubmitReceipt?: boolean
  canResubmitReceipt?: boolean
  eligible?: boolean
  evidencePolicyUnconfigured?: boolean
  hasPayableItems?: boolean
  payableItems?: Array<{
    itemType: string
    itemName: string
    evidenceRequired: boolean | null
    maxLimitWon?: number | null
  }>
  submittedItems?: Array<{
    itemType?: string
    amount?: number
    evidenceRequired?: boolean | null
  }>
  /** 개인형 회차 학생 교통비 편도 거리 안내(서버). 신청란 노출은 payableItems 기준 */
  transportPreview?: {
    oneWayDistanceKm?: number | null
    eligible?: boolean
    ineligibleReason?: string | null
  } | null
  submitBlockedReason?: string
  deadlineNotice?: SettlementDeadlineNotice
  previousAmount?: number
  /** 정정 승인 후 재신청 가능 여부(서버 statementReapplyAvailable). 기한이 지나면 false */
  reapplyAvailable?: boolean
  /** 재신청 마감일(YYYY-MM-DD, Asia/Seoul). 정정 승인 후 DRAFT에만 있다 */
  reapplyDeadlineDate?: string
  /** 강사 지급조서: 사업 운영 종료일이 지났으면 true — 작성·재신청을 막는다 */
  operationEnded?: boolean
  /** 강사 지급조서: 사업 운영 종료일(YYYY-MM-DD). 마감 후 지연 제출 안내에 쓴다 */
  businessEndDate?: string
}

export const EDUCATION_SETTLEMENT_PAGE_SIZE = 7

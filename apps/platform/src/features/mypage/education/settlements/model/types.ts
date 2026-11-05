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
  sessionNumber: number
  heldAt: string
  /** 예: 10:00~11:20 3차시 */
  sessionMeta: string
  /** 배정 학교·기관명. API에 값이 있을 때만 채운다. */
  institutionLabel?: string
  /** 학교·기관명. 강의보고서 뱃지 `primary` */
  institutionName?: string
  /** 학년. 강의보고서 뱃지 `secondary` */
  grade?: string
  progress: EducationSettlementProgress
  status: EducationSettlementStatus
  deadlineAt?: string
  submittedAt?: string
  deadlineLabel?: string
  amount?: number
  rejectReason?: string
  settlementApplicationId?: number
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
  }>
  submittedItems?: Array<{
    itemType?: string
    amount?: number
    evidenceRequired?: boolean | null
  }>
  submitBlockedReason?: string
  deadlineNotice?: SettlementDeadlineNotice
  previousAmount?: number
}

export const EDUCATION_SETTLEMENT_PAGE_SIZE = 7

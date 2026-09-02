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
  | 'upcoming'

export type EducationSettlementItem = {
  id: string
  sessionNumber: number
  heldAt: string
  /** 예: 10:00~11:20 3차시 */
  sessionMeta: string
  progress: EducationSettlementProgress
  status: EducationSettlementStatus
  deadlineLabel?: string
  amount?: number
  rejectReason?: string
}

export const EDUCATION_SETTLEMENT_PAGE_SIZE = 7

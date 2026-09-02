import type { EducationSettlementItem, EducationSettlementStatus } from '../model/types'

export const EDUCATION_SETTLEMENT_PROGRESS_LABEL = {
  completed: '진행 완료',
  upcoming: '진행 대상',
} as const

export type SettlementAmountKind = 'expected' | 'completed'

const UNWRITTEN_STATUSES: readonly EducationSettlementStatus[] = [
  'report_pending',
  'pending_submit',
  'overdue',
]

const IN_REVIEW_STATUSES: readonly EducationSettlementStatus[] = ['waiting_confirm', 'reapplied']

export function countUnwrittenSettlements(items: readonly EducationSettlementItem[]): number {
  return items.filter(item => UNWRITTEN_STATUSES.includes(item.status)).length
}

export function countCompletedSettlementSessions(
  items: readonly EducationSettlementItem[]
): number {
  return items.filter(item => item.progress === 'completed').length
}

export function resolvePaymentStatementProcessLabel(
  items: readonly EducationSettlementItem[]
): string {
  if (items.some(item => IN_REVIEW_STATUSES.includes(item.status))) {
    return '확인진행중'
  }
  const unwritten = countUnwrittenSettlements(items)
  if (unwritten > 0) return `미작성 ${unwritten}건`
  if (items.some(item => item.status === 'rejected')) return '신청 반려'
  if (
    items.length > 0 &&
    items.every(item => item.status === 'paid' || item.status === 'upcoming')
  ) {
    return '지급 완료'
  }
  if (items.some(item => item.status === 'confirmed' || item.status === 'paid')) {
    return '확인 완료'
  }
  return '확인진행중'
}

import type { EducationSettlementItem, EducationSettlementStatus } from '../model/types.ts'

/** CMS 프로그램 상세 집계와 동일한 지급조서 처리 현황 문구 */
export const PAYMENT_STATEMENT_AGGREGATE_LABEL = {
  none: '해당 없음',
  awaiting_confirmation: '확인 대기 중',
  payment_statement_reapplication: '지급조서 재신청',
  partial_confirmation: '확인 진행 중',
  payment_statement_verified: '지급조서 확인 완료',
  account_paid: '계좌 지급 완료',
  application_rejected: '신청 반려',
  payment_correction_requested: '지급 정정 요청',
} as const

export type PaymentStatementAggregateKey = keyof typeof PAYMENT_STATEMENT_AGGREGATE_LABEL

const PAID = new Set(['PAID'])
const CONFIRMED = new Set(['CONFIRMED', 'APPROVED'])
const REAPPLIED = new Set(['REAPPLICATION', 'RESUBMITTED', 'REAPPLIED'])
const WAITING = new Set(['WAITING_CONFIRM', 'REQUESTED', 'ISSUED', 'SUBMITTED'])
const REJECTED = new Set(['REJECTED'])
const CORRECTION_REQUESTED = new Set(['CORRECTION_REQUESTED'])
const CORRECTION_COMPLETED = new Set([
  'CORRECTION_COMPLETED',
  'CORRECTION_APPROVED',
  'CORRECTION_DONE',
])
const REPORT_PENDING = new Set(['REPORT_PENDING', 'LECTURE_REPORT_REQUIRED'])

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

export function isGeminiSettlementProgram(input: {
  programType?: string | null
  detailCase?: string | null
}): boolean {
  const type = (input.programType ?? '').trim().toUpperCase()
  if (type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING') {
    return true
  }
  return input.detailCase === 'gemini'
}

/** 서버 지급조서·계좌 축 → 화면 내부 상태. 명시된 값만 매핑한다. */
export function mapPaymentStatementServerStatus(input: {
  statementStatus?: string | null
  paymentStatus?: string | null
  correctionStatus?: string | null
  /** 정정 승인 후 강사 재신청 대기(최신 revision DRAFT). 서버 statementReapplyAvailable */
  statementReapplyAvailable?: boolean | null
}): EducationSettlementStatus | null {
  const payment = normalize(input.paymentStatus)
  const statement = normalize(input.statementStatus)
  const correction = normalize(input.correctionStatus)

  if (PAID.has(payment) || PAID.has(statement)) return 'paid'
  if (
    input.statementReapplyAvailable === true ||
    CORRECTION_COMPLETED.has(correction) ||
    CORRECTION_COMPLETED.has(statement)
  ) {
    return 'correction_completed'
  }
  if (
    CORRECTION_REQUESTED.has(payment) ||
    CORRECTION_REQUESTED.has(statement) ||
    CORRECTION_REQUESTED.has(correction)
  ) {
    return 'correction_requested'
  }
  if (REJECTED.has(statement)) return 'rejected'
  if (CONFIRMED.has(statement) || payment === 'WAITING_PAYMENT' || CONFIRMED.has(payment)) {
    return 'confirmed'
  }
  if (REAPPLIED.has(statement)) return 'reapplied'
  if (WAITING.has(statement)) return 'waiting_confirm'
  if (REPORT_PENDING.has(statement)) return 'report_pending'
  return null
}

function aggregateKeyForStatus(
  status: EducationSettlementStatus,
): PaymentStatementAggregateKey | null {
  switch (status) {
    case 'waiting_confirm':
      return 'awaiting_confirmation'
    case 'reapplied':
      return 'payment_statement_reapplication'
    // 정정 승인 후 강사가 재신청하기 전까지는 "지급 정정 요청"으로 집계한다(CMS 강사 상태와 같음).
    case 'correction_completed':
      return 'payment_correction_requested'
    case 'confirmed':
      return 'payment_statement_verified'
    case 'paid':
      return 'account_paid'
    case 'rejected':
      return 'application_rejected'
    case 'correction_requested':
      return 'payment_correction_requested'
    default:
      return null
  }
}

export function resolveInstructorPaymentStatementAggregateLabel(
  items: readonly EducationSettlementItem[],
): string {
  const keys = items
    .filter(item => item.progress === 'completed')
    .map(item => aggregateKeyForStatus(item.status))
    .filter((key): key is PaymentStatementAggregateKey => key != null)

  if (keys.length === 0) return PAYMENT_STATEMENT_AGGREGATE_LABEL.none
  const unique = new Set(keys)
  if (unique.size === 1) return PAYMENT_STATEMENT_AGGREGATE_LABEL[keys[0]!]
  return PAYMENT_STATEMENT_AGGREGATE_LABEL.partial_confirmation
}

export function resolveGeminiPaymentStatementAggregateLabel(
  items: readonly EducationSettlementItem[],
): string {
  const submitted = items.filter(
    item =>
      item.progress === 'completed' &&
      (item.status === 'waiting_confirm' ||
        item.status === 'reapplied' ||
        item.status === 'confirmed' ||
        item.status === 'paid'),
  )
  if (submitted.length === 0) return PAYMENT_STATEMENT_AGGREGATE_LABEL.partial_confirmation
  if (submitted.every(item => item.status === 'paid')) {
    return PAYMENT_STATEMENT_AGGREGATE_LABEL.account_paid
  }
  if (submitted.every(item => item.status === 'waiting_confirm' || item.status === 'reapplied')) {
    return PAYMENT_STATEMENT_AGGREGATE_LABEL.awaiting_confirmation
  }
  return PAYMENT_STATEMENT_AGGREGATE_LABEL.partial_confirmation
}

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

/**
 * CMS가 정산(지급조서)이 생기기 전 신청서에 정정 요청을 보낸 경우.
 * 지급조서가 있는 회원 정정 요청(settlementId 있음)과 구분한다.
 */
export function isAdminApplicationCorrectionRequest(input: {
  applicationStatus?: string | null
  settlementId?: number | null
}): boolean {
  return normalize(input.applicationStatus) === 'CORRECTION_REQUESTED' && input.settlementId == null
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

const INSTRUCTOR_CONFIRMATION_STATUS = new Set([
  'WAITING_CONFIRM',
  'REAPPLICATION',
  'CORRECTION_REQUESTED',
  'REJECTED',
  'CONFIRMED',
])

function mapInstructorConfirmationValue(
  confirmationStatus: string | null | undefined,
): EducationSettlementStatus | null {
  const confirmation = normalize(confirmationStatus)
  if (!INSTRUCTOR_CONFIRMATION_STATUS.has(confirmation)) return null
  switch (confirmation) {
    case 'WAITING_CONFIRM':
      return 'waiting_confirm'
    case 'REAPPLICATION':
      return 'reapplied'
    case 'CORRECTION_REQUESTED':
      return 'correction_requested'
    case 'REJECTED':
      return 'rejected'
    case 'CONFIRMED':
      return 'confirmed'
    default:
      return null
  }
}

/**
 * 서버 지급조서·계좌 축 → 화면 내부 상태. 명시된 값만 매핑한다.
 * PAID·DRAFT·statementReapplyAvailable 을 confirmationStatus 보다 먼저 본다.
 * confirmationStatus 가 없으면 statementStatus ?? status 를 쓴다.
 * SUBMITTED 를 확인 대기로 보는 분기는 confirmationStatus 가 없을 때만 탄다.
 */
export function mapPaymentStatementServerStatus(input: {
  statementStatus?: string | null
  /** confirmationStatus 가 없을 때 statementStatus 다음으로 보는 신청서 status */
  status?: string | null
  paymentStatus?: string | null
  correctionStatus?: string | null
  /** 정정 승인 후 강사 재신청 대기(최신 revision DRAFT). 서버 statementReapplyAvailable */
  statementReapplyAvailable?: boolean | null
  /**
   * 강사 목록 확인 분기. WAITING_CONFIRM | REAPPLICATION | CORRECTION_REQUESTED | REJECTED | CONFIRMED.
   * null·생략·허용값 밖이면 statementStatus ?? status.
   */
  confirmationStatus?: string | null
}): EducationSettlementStatus | null {
  const payment = normalize(input.paymentStatus)
  const statement = normalize(input.statementStatus ?? input.status)
  const correction = normalize(input.correctionStatus)

  if (PAID.has(payment) || PAID.has(statement)) return 'paid'
  // DRAFT = 정정 승인 후 강사 재신청 대기. 재신청 기한이 지나 available이 false여도 상태는 '지급 정정 요청'으로 둔다.
  // 이 경우 서버 confirmationStatus 도 CORRECTION_REQUESTED 이므로 confirmation 보다 먼저 둔다.
  if (
    input.statementReapplyAvailable === true ||
    statement === 'DRAFT' ||
    CORRECTION_COMPLETED.has(correction) ||
    CORRECTION_COMPLETED.has(statement)
  ) {
    return 'correction_completed'
  }
  const confirmed = mapInstructorConfirmationValue(input.confirmationStatus)
  if (confirmed) return confirmed
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

/** 영수증 일정. statementStatus·paymentStatus가 모두 없으면 신청 전/미승인. */
export function mapReceiptScheduleOverviewStatus(input: {
  statementStatus?: string | null
  paymentStatus?: string | null
}):
  | 'waiting_confirm'
  | 'reapplied'
  | 'confirmed'
  | 'paid'
  | 'rejected'
  | null {
  const statement = normalize(input.statementStatus)
  const payment = normalize(input.paymentStatus)
  if (!statement && !payment) return null
  const mapped = mapPaymentStatementServerStatus({
    statementStatus: statement,
    paymentStatus: payment,
  })
  if (
    mapped === 'waiting_confirm' ||
    mapped === 'reapplied' ||
    mapped === 'confirmed' ||
    mapped === 'paid' ||
    mapped === 'rejected'
  ) {
    return mapped
  }
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

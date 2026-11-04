/**
 * 정산 관리 > 계좌 지급 확인 — FE view types·표시 헬퍼
 */

import type {
  PaymentOrderAdminProcessingStatus,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  ACCOUNT_PAYMENT_AGGREGATE_LABELS,
  type AccountPaymentAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'

export type AccountPaymentTransferStatus = AccountPaymentAggregateStatus

export const ACCOUNT_PAYMENT_STATUS_LABELS: Record<AccountPaymentTransferStatus, string> = {
  awaiting_confirmation: ACCOUNT_PAYMENT_AGGREGATE_LABELS.awaiting_confirmation,
  partial_confirmation: ACCOUNT_PAYMENT_AGGREGATE_LABELS.partial_confirmation,
  account_paid: ACCOUNT_PAYMENT_AGGREGATE_LABELS.account_paid,
  payment_correction_requested: ACCOUNT_PAYMENT_AGGREGATE_LABELS.payment_correction_requested,
}

export interface AccountPaymentRow {
  id: string
  accountPaymentId?: number
  settlementId?: number
  instructorMemberId?: number
  no: number
  instructorName: string
  programId?: number
  programName: string
  institutionName: string
  sessionLabel: string
  accountPaymentStatus: AccountPaymentTransferStatus
  amount: number
  lectureDate?: string
  transferScheduledDate: string
  paidAt?: string
  bankName?: string
  maskedAccountNo?: string
  accountHolder?: string
  depositAccountNumber?: string
  recipientMobile?: string
  /** 정산 상세 withholding 항목 합(원). 목록에 없으면 미리보기에서 세액 행을 만들지 않는다 */
  withholdingTaxAmount?: number
  /** 정산 상세 payee 마스킹 주민등록번호. 원문 금지 */
  residentRegistrationNumberMasked?: string
  paymentOrderStatus: Extract<PaymentOrderAdminProcessingStatus, 'confirmed'>
}

/** FE mock 제거 후 remote 목록 연동 전 빈 목록 */
export const mockAccountPaymentRows: AccountPaymentRow[] = []

export function resolveAccountPaymentAttendanceDate(row: AccountPaymentRow): string {
  const lecture = row.lectureDate?.trim()
  if (lecture) return lecture
  return row.transferScheduledDate
}

export function resolveAccountPaymentCalendarDate(row: AccountPaymentRow): string {
  const scheduled = row.transferScheduledDate?.trim()
  if (scheduled) return scheduled.slice(0, 10)
  return ''
}

export function formatAccountPaymentSessionLabelDisplay(raw: string): string {
  const t = raw?.trim()
  if (!t) return '-'
  return t
}

export function formatAccountPaymentInstitutionDisplay(raw: string): string {
  const t = raw?.trim()
  if (!t) return '-'
  return t
}

export function isPaymentOrderStatementConfirmedForAccountPayments(
  row: AccountPaymentRow
): boolean {
  return row.paymentOrderStatus === 'confirmed'
}

export interface AccountPaymentStatusDetailBasic {
  nameKo: string
  nameEn: string
  genderBirthDisplay?: string
  scheduleChangeCancelCount?: number
  phoneDisplay: string
  emailDisplay: string
  addressDisplay: string
  addressBlurredTail?: string
  settlementAccountBankNumberPart: string
  settlementAccountHolderPart: string
  programName: string
  programSessionProgressDisplay: string
  businessPeriodDisplay: string
  accountPaymentStatus: AccountPaymentTransferStatus
  accountPaymentStatusLabel: string
  transferScheduledDateDisplay: string
  paidAtDisplay: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

export interface AccountPaymentPlainAccountForConfirm {
  bankAndNumber: string
  holder: string
}

export interface AccountPaymentStatusDetail {
  basic: AccountPaymentStatusDetailBasic
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  plainAccountForPaymentConfirm: AccountPaymentPlainAccountForConfirm
}

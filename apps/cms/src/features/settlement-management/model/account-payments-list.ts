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
  /**
   * 받는 분 휴대폰 마스킹값(BE 목록 `maskedRecipientPhone`, 정책 CMS-07). 대량이체 양식 **미리보기 전용**.
   * 원문은 서버 XLSX 다운로드에만 있으므로 다운로드 값으로 쓰지 않는다.
   */
  maskedRecipientPhone?: string
  /** 정산 상세 withholding 항목 합(원). 목록에 없으면 미리보기에서 세액 행을 만들지 않는다 */
  withholdingTaxAmount?: number
  /** 정산 상세 payee 마스킹 주민등록번호. 원문 금지 */
  residentRegistrationNumberMasked?: string
  paymentOrderStatus: Extract<PaymentOrderAdminProcessingStatus, 'confirmed'>
  /**
   * 지급 대상 유형(A2): INSTRUCTOR(강사 지급조서·Gemini) | PARTICIPANT(참여자 영수증) | VOLUNTEER(봉사자 영수증).
   * TODO(시안 확인 대기): 계좌 지급 목록 시안(12432:443040)에 유형 열이 없어 화면에는 아직 표시하지 않는다.
   */
  payeeType?: AccountPaymentPayeeType
  /** 계좌 지급 출처. INDIVIDUAL_SETTLEMENT = 참여자·봉사자 영수증 */
  sourceType?: string
}

/** FE mock 제거 후 remote 목록 연동 전 빈 목록 */
export type AccountPaymentPayeeType = 'INSTRUCTOR' | 'PARTICIPANT' | 'VOLUNTEER'

/** 지급 대상 유형 라벨 (A2) */
export const ACCOUNT_PAYMENT_PAYEE_TYPE_LABELS: Record<AccountPaymentPayeeType, string> = {
  INSTRUCTOR: '강사',
  PARTICIPANT: '참여자',
  VOLUNTEER: '봉사자',
}

/** 영수증(참여자·봉사자) 계좌 지급 건 — 원천징수 0원, 지급 실패 처리 없음(A3) */
export function isReceiptAccountPayment(
  row: Pick<AccountPaymentRow, 'payeeType' | 'sourceType'>
): boolean {
  return (
    row.payeeType === 'PARTICIPANT' ||
    row.payeeType === 'VOLUNTEER' ||
    row.sourceType?.trim().toUpperCase() === 'INDIVIDUAL_SETTLEMENT'
  )
}

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
  /**
   * 지급조서 「교육 진행 차시」 = 인정 차시(`SettlementFrontendResponse.recognizedSessionCount`, BE N5).
   * 없으면 null — 진행 회차·회차 번호로 대체하지 않는다.
   */
  recognizedSessionCount?: number | null
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
  /** 상세 GET settlement.programId — 개인형 판정(참여 기관명 열 숨김)용. 목록 행에 없을 수 있다. */
  programId?: string
  /**
   * 상세 GET `programType`(program.program_type, 예: GENERAL_INDIVIDUAL).
   * 개인형이면 참여 기관명 열을 숨긴다. 이 값을 주지 않는 이전 BE에서는 undefined.
   */
  programType?: string
  /** 영수증(참여자·봉사자) 지급 건이면 true — 강사비·원천징수 행 없음 */
  isReceiptPayment?: boolean
  /**
   * 영수증 첨부(E3). fileObjectId로 기존 다운로드 경로를 쓴다.
   * TODO(시안 확인 대기): 계좌 지급 상세에 첨부 보기 영역이 없어 화면에는 아직 연결하지 않았다.
   */
  receiptAttachments?: AccountPaymentReceiptAttachment[]
}

export interface AccountPaymentReceiptAttachment {
  fileObjectId: number
  fileName: string
  contentType?: string
  fileSize?: number
  /** TRANSPORTATION 등 원값 */
  itemType?: string
  applicationItemId?: number
}

/**
 * 계좌 지급 대상 「사람 수」 — 같은 신청자가 여러 행(회차)이어도 1명.
 * 식별은 BE `instructorMemberId`. 없는 행만 신청자명으로 묶는다.
 */
export function countAccountPaymentRecipients(
  rows: readonly Pick<AccountPaymentRow, 'instructorMemberId' | 'instructorName' | 'id'>[]
): number {
  const keys = new Set<string>()
  for (const row of rows) {
    if (row.instructorMemberId != null) keys.add(`member:${row.instructorMemberId}`)
    else keys.add(`name:${row.instructorName?.trim() || row.id}`)
  }
  return keys.size
}

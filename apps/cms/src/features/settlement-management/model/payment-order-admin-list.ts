/**
 * 정산 관리 > 지급조서 확인 — 프로그램별·강사별 집계 목록 Mock
 * (화면 전용; domain PaymentStatement와 별개)
 */

import type { PaymentOrderCalculationBasisDetail } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import { formatDateDotWithWeekday } from '@/shared/utils/date'

export type PaymentOrderAdminProcessingStatus =
  | 'pending'
  | 'reapplication'
  | 'partial'
  | 'confirmed'
  | 'correction'
  | 'application_rejected'

/**
 * 목록·테이블 지급조서 처리 현황 — 전체 문구 (캘린더만 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 함축형)
 */
export const PAYMENT_ORDER_STATUS_LABELS_LIST: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  partial: '확인 진행 중',
  application_rejected: '신청 반려',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
}

/** 배지·상세 라벨 — 테이블과 동일 전체 문구 */
export const PAYMENT_ORDER_STATUS_LABELS_DETAIL: Record<PaymentOrderAdminProcessingStatus, string> =
  {
    pending: '확인 대기 중',
    reapplication: '지급조서 재신청',
    partial: '확인 진행 중',
    confirmed: '지급조서 확인 완료',
    application_rejected: '신청 반려',
    correction: '지급 정정 요청',
  }

/** 캘린더 전용 함축형 — 카드·툴팁·그리드 타이틀 한 줄에만 사용 */
export const PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  pending: '확인 대기',
  reapplication: '재신청',
  partial: '확인 중',
  confirmed: '확인 완료',
  application_rejected: '신청 반려',
  correction: '정정 요청',
}

/** @deprecated 캘린더는 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 사용 */
export const PAYMENT_ORDER_CALENDAR_STATUS_SHORT_DETAIL: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST

export interface PaymentOrderAdminProgramRow {
  no: number
  /** API 집계 키 (programId) */
  programId?: number
  aggregateKey?: string
  programName: string
  instructorCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 필터용 기준일 (기간 필터 보조) */
  referenceDate: string
  /** 실제 출강일(정산 항목) — 기간 필터·캘린더 이벤트에 사용 */
  settlementRelevantAttendanceDates: string[]
  /** 지급 대기 정산 항목 수 — 버킷 필터·목록 열 */
  pendingPaymentSettlementItemCount: number
}

export interface PaymentOrderAdminInstructorRow {
  no: number
  /** API 집계 키 (instructorMemberId) */
  instructorMemberId?: number
  aggregateKey?: string
  instructorName: string
  programCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 강사별 뷰에서 프로그램명 필터: 참여 프로그램명 중 하나라도 포함 시 매칭 */
  relatedProgramNames: string[]
  referenceDate: string
  settlementRelevantAttendanceDates: string[]
  pendingPaymentSettlementItemCount: number
  /** 주간 시간 격자: 세션 시작·종료(HH:mm) — 있으면 태그를 해당 시간대에 배치 */
  calendarSlotStartTime?: string
  calendarSlotEndTime?: string
  /** 주간 격자 태그 본문(줄바꿈 가능). 없으면 강사명·프로그램명 등으로 대체 */
  calendarWeekGridLabel?: string
}

/** 지급 현황 상세 — 강사별 정산 목록 행 (집계 상태와 별도; 신청 반려 등) */
export type PaymentOrderAdminLineProcessingStatus =
  | 'pending'
  | 'reapplication'
  | 'confirmed'
  /** 지급조서 확인 완료 후 계좌 지급 대기 (`CONFIRMED` + `WAITING_PAYMENT`) */
  | 'awaiting_payment'
  | 'correction'
  | 'rejected'
  /** 지급 신청 반려(라인 전용; 목록 `PaymentOrderAdminProcessingStatus` 와 분리) */
  | 'application_rejected'

export const PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  confirmed: '지급조서 확인 완료',
  awaiting_payment: '지급 대기',
  correction: '지급 정정 요청',
  rejected: '계좌 지급 완료',
  application_rejected: '신청 반려',
}

/** 목록·상세 합산: 신청 반려·지급 정정 요청·계좌 지급 완료 제외 */
export function countsTowardPaymentOrderEstimatedAmount(
  status: PaymentOrderAdminLineProcessingStatus
): boolean {
  return status !== 'application_rejected' && status !== 'correction' && status !== 'rejected'
}

export interface PaymentOrderAdminProgramDetailInstructorRow {
  id: string
  no: number
  settlementId?: number
  statementId?: number
  instructorName: string
  institutionName: string
  /** 강의일 (ISO YYYY-MM-DD) */
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
  /** 일괄 확인 시 선택한 강사비 지급 예정일 (ISO YYYY-MM-DD) */
  lectureFeePaymentScheduledDate?: string
  /** 신청 반려 시 산출 내역서·상세에 표시할 사유 */
  processingRejectionReason?: string
  /** BE `settlementCorrectionRequestId` — 지급 정정 요청 건 승인·반려 대상 */
  correctionRequestId?: number
  /** BE `correctionReason` — 지급 정정 요청 사유 */
  correctionReason?: string
  /** BE `availableActions`에 `CONFIRM_PAYMENT_STATEMENT` 포함 여부 */
  canConfirmPaymentStatement?: boolean
  statementStatus?: string
  paymentStatus?: string
  availableActions?: string[]
}

export interface PaymentOrderAdminProgramDetail {
  programNo: number
  programName: string
  aggregateProcessingStatus: PaymentOrderAdminProcessingStatus
  businessPeriodStart: string
  businessPeriodEnd: string
  sessionCompleted: number
  sessionTotal: number
  instructorRows: PaymentOrderAdminProgramDetailInstructorRow[]
}

/** 강사 기준 지급 현황 상세 — 프로그램별 정산 행 */
export interface PaymentOrderAdminInstructorDetailProgramRow {
  id: string
  no: number
  settlementId?: number
  statementId?: number
  programName: string
  institutionName: string
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
  /** 일괄 확인 시 선택한 강사비 지급 예정일 (ISO YYYY-MM-DD) */
  lectureFeePaymentScheduledDate?: string
  /** 신청 반려 시 산출 내역서·상세에 표시할 사유 */
  processingRejectionReason?: string
  /** BE `settlementCorrectionRequestId` — 지급 정정 요청 건 승인·반려 대상 */
  correctionRequestId?: number
  /** BE `correctionReason` — 지급 정정 요청 사유 */
  correctionReason?: string
  /** BE `availableActions`에 `CONFIRM_PAYMENT_STATEMENT` 포함 여부 */
  canConfirmPaymentStatement?: boolean
  statementStatus?: string
  paymentStatus?: string
  availableActions?: string[]
}

/** 산출 내역서 모달 — 산정 행 구분(합계 수식·표시용) */
export type PaymentOrderCalculationLineKind =
  | 'lecture_fee'
  | 'travel'
  | 'lodging'
  | 'meal'
  | 'activity'
  | 'withholding'

/** 산출 내역서 모달 — 기본 정보(프로그램 맥락 4열 `program-detail-info-tab`) */
export interface PaymentOrderCalculationStatementProgramBasicInfo {
  programName: string
  /** 확인 모달 본문 등에 쓰는 강사명 */
  instructorNameKo: string
  /** 사업 운영 기간 한 줄 (예: `2025. 12. 08(월) ~ 2026. 12. 30(수)`) */
  businessPeriodDisplay: string
  /** 프로그램 진행 회차 (예: `4 / 16`) */
  programSessionProgressDisplay: string
  /** 해당 강사 라인의 지급조서 처리 현황 문구 */
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  /** 지급 반려 시 「사유 : …」에 표시할 본문 */
  processingRejectionReason?: string
  /** 지급 정정 요청 — 승인·반려 대상 id */
  correctionRequestId?: number
  /** 지급 정정 요청 사유 */
  correctionReason?: string
  /** 지급조서 확인 완료 시 이체 예정일(요일 포함 한 줄) */
  lectureFeePaymentScheduledDateDisplay?: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

/** 산출 내역서 모달 — 기본 정보(강사 맥락 `applicant-instructor-basic-info` 5열·2블록) */
export interface PaymentOrderCalculationStatementInstructorBasicInfo {
  nameKo: string
  nameEn: string
  phoneDisplay: string
  emailDisplay: string
  addressDisplay: string
  addressBlurredTail?: string
  settlementAccountBankNumberPart: string
  settlementAccountHolderPart: string
  /** settlement.payee 또는 stub. 없으면 `-` */
  genderBirthDisplay?: string
  /** 1 이상이면 성명 옆 일정 변경 배지 */
  scheduleChangeCancelCount?: number
  /** 지급조서 발급용 — UI 미노출 */
  programName?: string
  /** settlement.payee — 발급 양식 소속 */
  affiliation?: string
  /** settlement.payee — 발급 양식 주민등록번호(MASKED) */
  residentRegistrationNumber?: string
  /** settlement.payee — 발급 양식 도로명 */
  addressRoad?: string
  /** settlement.payee — 발급 양식 상세주소 */
  addressDetail?: string
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  processingRejectionReason?: string
  /** 지급 정정 요청 — 승인·반려 대상 id */
  correctionRequestId?: number
  /** 지급 정정 요청 사유 */
  correctionReason?: string
  /** 지급조서 확인 완료 시 이체 예정일(요일 포함 한 줄) */
  lectureFeePaymentScheduledDateDisplay?: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

export interface PaymentOrderCalculationStatementLine {
  id: string
  itemLabel: string
  description: string
  /** 양수: 가산, 음수: 차감 */
  amount: number
  kind: PaymentOrderCalculationLineKind
  /** 시안 마스킹 등 — 있으면 정산 금액 열에 이 문자열을 표시 */
  amountDisplayOverride?: string
  /** 산정 기준 상세 모달 payload (read-only) */
  basisDetail?: PaymentOrderCalculationBasisDetail
  /** withholding 「구분」— BE taxIncomeTypeDisplay만. 없으면 `-` */
  taxIncomeTypeDisplay?: string | null
}

export interface PaymentOrderCalculationStatementSessionBlock {
  institutionName: string
  /** 강의 진행 일자 — 날짜(요일) 구간 (테이블에서 디바이더로 회차와 구분) */
  lectureDateDisplay: string
  /** 예: 2 ~ 3차시 */
  lectureSessionDisplay: string
  lines: PaymentOrderCalculationStatementLine[]
}

export type PaymentOrderProgramCalculationStatement =
  | {
      context: 'program'
      /** 강사 별 정산 목록 행 id — 확인/반려 후 테이블 동기화용 */
      sourceLineRowId: string
      basic: PaymentOrderCalculationStatementProgramBasicInfo
      blocks: PaymentOrderCalculationStatementSessionBlock[]
      formulaLabel: string
      totalAmount: number
    }
  | {
      context: 'instructor'
      /** 프로그램별 정산 목록 행 id */
      sourceLineRowId: string
      basic: PaymentOrderCalculationStatementInstructorBasicInfo
      blocks: PaymentOrderCalculationStatementSessionBlock[]
      formulaLabel: string
      totalAmount: number
    }

/** 강사 집계 행 기준 상세(기본 정보 + 프로그램별 정산 목록) mock 원본 */
export interface PaymentOrderAdminInstructorDetail {
  instructorNo: number
  nameKo: string
  nameEn: string
  address: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  accountHolder: string
  /** 목록 테이블과 동일한 총 정산 신청 금액 */
  totalEstimatedAmount: number
  /** Mock 시드 기반. Remote 미제공 시 `-` */
  genderBirthDisplay?: string
  /** 1 이상이면 성명 옆 일정 변경 배지 */
  scheduleChangeCancelCount?: number
  programRows: PaymentOrderAdminInstructorDetailProgramRow[]
}

function formatIsoToKoreanWeekday(iso: string): string {
  const label = formatDateDotWithWeekday(iso.slice(0, 10))
  return label === '-' ? iso : label
}

function splitAddressAfterDongForStatement(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  const tail = address.slice(end).trimStart()
  if (!tail) return null
  return { head: address.slice(0, end), tail }
}

export function addressDisplayForStatementBlur(address: string): {
  addressDisplay: string
  addressBlurredTail?: string
} {
  const split = splitAddressAfterDongForStatement(address)
  if (split) {
    return { addressDisplay: split.head, addressBlurredTail: split.tail }
  }
  const headLen = Math.min(14, address.length)
  const head = address.slice(0, headLen)
  const tail = address.slice(headLen).trimStart()
  if (!tail) {
    return { addressDisplay: head }
  }
  return { addressDisplay: head, addressBlurredTail: tail }
}

export { formatIsoToKoreanWeekday }

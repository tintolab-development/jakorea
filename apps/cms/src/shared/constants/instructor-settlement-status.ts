/**
 * 강사 정산 현황 8종 — 라벨·색상·배지/텍스트 클래스 단일 정의
 * (회원 상세 정산 탭, 참여 강사 목록, 지급조서·계좌 지급 캘린더 등 공통)
 */

export type InstructorSettlementUiStatus =
  | 'payment_statement_reapplication'
  | 'awaiting_confirmation'
  | 'partial_confirmation'
  | 'payment_statement_verified'
  | 'account_paid'
  | 'none'
  | 'application_rejected'
  | 'payment_correction_requested'

/** 스크린샷·필터·목록 표시 순서 */
export const INSTRUCTOR_SETTLEMENT_STATUS_ORDER = [
  'payment_statement_reapplication',
  'awaiting_confirmation',
  'partial_confirmation',
  'payment_statement_verified',
  'account_paid',
  'none',
  'application_rejected',
  'payment_correction_requested',
] as const satisfies readonly InstructorSettlementUiStatus[]

export const INSTRUCTOR_SETTLEMENT_STATUS_LABELS: Record<
  InstructorSettlementUiStatus,
  string
> = {
  payment_statement_reapplication: '지급조서 재신청',
  awaiting_confirmation: '확인 대기 중',
  partial_confirmation: '확인 진행 중',
  payment_statement_verified: '지급조서 확인 완료',
  account_paid: '계좌 지급 완료',
  none: '해당 없음',
  application_rejected: '신청 반려',
  payment_correction_requested: '지급 정정 요청',
}

/** 캘린더 스트립·짧은 표기 */
export const INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT: Record<
  InstructorSettlementUiStatus,
  string
> = {
  payment_statement_reapplication: '재신청',
  awaiting_confirmation: '지급대기',
  partial_confirmation: '일부 확인',
  payment_statement_verified: '확인 완료',
  account_paid: '지급완료',
  none: '해당 없음',
  application_rejected: '신청 반려',
  payment_correction_requested: '정정 요청',
}

/** 텍스트·배지 글자색 (status-badge instructor-settlement-* 와 동기화) */
export const INSTRUCTOR_SETTLEMENT_STATUS_COLORS: Record<
  InstructorSettlementUiStatus,
  string
> = {
  payment_statement_reapplication: '#c45c00',
  awaiting_confirmation: '#f07917',
  partial_confirmation: '#8457ce',
  payment_statement_verified: '#1e8c29',
  account_paid: '#017eaf',
  none: '#333333',
  application_rejected: '#c32f4a',
  payment_correction_requested: '#e8007c',
}

/** 캘린더 셀·인라인 태그 — 6% / 10% mix */
export const INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE: Record<
  InstructorSettlementUiStatus,
  { bg: string; color: string; border: string }
> = {
  payment_statement_reapplication: {
    bg: 'rgba(196, 92, 0, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.payment_statement_reapplication,
    border: 'rgba(196, 92, 0, 0.1)',
  },
  awaiting_confirmation: {
    bg: 'rgba(240, 121, 23, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.awaiting_confirmation,
    border: 'rgba(240, 121, 23, 0.1)',
  },
  partial_confirmation: {
    bg: 'rgba(132, 87, 206, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.partial_confirmation,
    border: 'rgba(132, 87, 206, 0.1)',
  },
  payment_statement_verified: {
    bg: 'rgba(30, 140, 41, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.payment_statement_verified,
    border: 'rgba(30, 140, 41, 0.1)',
  },
  account_paid: {
    bg: 'rgba(1, 126, 175, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.account_paid,
    border: 'rgba(1, 126, 175, 0.1)',
  },
  none: {
    bg: 'rgba(51, 51, 51, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.none,
    border: 'rgba(51, 51, 51, 0.1)',
  },
  application_rejected: {
    bg: 'rgba(195, 47, 74, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.application_rejected,
    border: 'rgba(195, 47, 74, 0.1)',
  },
  payment_correction_requested: {
    bg: 'rgba(232, 0, 124, 0.06)',
    color: INSTRUCTOR_SETTLEMENT_STATUS_COLORS.payment_correction_requested,
    border: 'rgba(232, 0, 124, 0.1)',
  },
}

/** `status-badge.css` — instructor-settlement-* 수정자 */
export const INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS: Record<
  InstructorSettlementUiStatus,
  string
> = {
  payment_statement_reapplication: 'status-badge--instructor-settlement-reapplication',
  awaiting_confirmation: 'status-badge--instructor-settlement-awaiting',
  partial_confirmation: 'status-badge--instructor-settlement-partial',
  payment_statement_verified: 'status-badge--instructor-settlement-statement-verified',
  account_paid: 'status-badge--instructor-settlement-account-paid',
  none: 'status-badge--instructor-settlement-na',
  application_rejected: 'status-badge--instructor-settlement-rejected',
  payment_correction_requested: 'status-badge--instructor-settlement-correction',
}

/** 텍스트 전용(배지 없음) — `instructor-settlement-status-text.css` */
export const INSTRUCTOR_SETTLEMENT_STATUS_TEXT_MODIFIER: Record<
  InstructorSettlementUiStatus,
  string
> = {
  payment_statement_reapplication: 'instructor-settlement-status-text--reapplication',
  awaiting_confirmation: 'instructor-settlement-status-text--awaiting',
  partial_confirmation: 'instructor-settlement-status-text--partial',
  payment_statement_verified: 'instructor-settlement-status-text--statement-verified',
  account_paid: 'instructor-settlement-status-text--account-paid',
  none: 'instructor-settlement-status-text--na',
  application_rejected: 'instructor-settlement-status-text--rejected',
  payment_correction_requested: 'instructor-settlement-status-text--correction',
}

export const INSTRUCTOR_SETTLEMENT_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE: InstructorSettlementUiStatus[] =
  ['payment_statement_verified', 'account_paid']

export function isInstructorSettlementEligibleForPaymentStatementIssue(
  status: InstructorSettlementUiStatus
): boolean {
  return INSTRUCTOR_SETTLEMENT_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE.includes(status)
}

export function getInstructorSettlementStatusLabel(
  status: InstructorSettlementUiStatus
): string {
  return INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]
}

export function getInstructorSettlementStatusTextClassName(
  status: InstructorSettlementUiStatus
): string {
  return `instructor-settlement-status-text ${INSTRUCTOR_SETTLEMENT_STATUS_TEXT_MODIFIER[status]}`
}

export function getInstructorSettlementInvoiceStatusPresentation(
  status: InstructorSettlementUiStatus
): { label: string; color: string } {
  return {
    label: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status],
    color: INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status].color,
  }
}

export const INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS = [
  { label: '전체', value: 'all' },
  ...INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map(value => ({
    label: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[value],
    value,
  })),
] as const

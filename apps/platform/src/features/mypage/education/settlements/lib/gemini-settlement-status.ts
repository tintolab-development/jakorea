const MISSING = '-'

export const GEMINI_SETTLEMENT_SUMMARY_PATH = (programId: string) =>
  `/api/portal/me/programs/${programId}/gemini-settlement-summary`

export const GEMINI_LECTURE_SCHEDULES_PATH = (programId: string) =>
  `/api/portal/me/programs/${programId}/gemini-lecture-schedules`

export type GeminiPaymentStatementProcessingStatusCode =
  | 'PARTIAL_CONFIRMATION'
  | 'AWAITING_CONFIRMATION'
  | 'ACCOUNT_PAID'

export type GeminiSettlementSummary = {
  paymentStatementProcessingStatusCode?: string | null
  lectureFeeBasis?: string | null
  businessIncome?: boolean | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}

export type GeminiLectureScheduleItem = {
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  institutionName?: string | null
  grade?: string | null
  sessionNo?: number | null
  lectureStatus?: string | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

/** 상단 처리 현황 — paymentStatementProcessingStatusCode 우선 */
export function mapGeminiPaymentStatementProcessLabel(input: {
  paymentStatementProcessingStatusCode?: string | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}): string {
  const primary = normalize(input.paymentStatementProcessingStatusCode)
  if (primary === 'PARTIAL_CONFIRMATION') return '확인 진행 중'
  if (primary === 'AWAITING_CONFIRMATION') return '확인 대기 중'
  if (primary === 'ACCOUNT_PAID') return '계좌 지급 완료'

  const fallback = normalize(input.accountPaymentStatus) || normalize(input.settlementStatus)
  if (
    fallback === 'NOT_READY' ||
    fallback === 'WAITING' ||
    fallback === 'WAITING_PAYMENT' ||
    fallback === 'ON_HOLD'
  ) {
    return '확인 대기 중'
  }
  if (fallback === 'READY_TO_PAY') return '확인 진행 중'
  if (fallback === 'PAID') return '계좌 지급 완료'
  if (fallback === 'FAILED') return '지급 실패'
  return MISSING
}

const LECTURE_FEE_BASIS_LABELS: Record<string, string> = {
  GRADE_1: '1급 강사비',
  GRADE_2: '2급 강사비',
  GRADE_3: '3급 강사비',
}

export function displayGeminiLectureFeeBasis(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return MISSING
  const mapped = LECTURE_FEE_BASIS_LABELS[trimmed.toUpperCase()]
  if (mapped) return mapped
  if (/^GRADE_/i.test(trimmed)) return MISSING
  return trimmed
}

export function displayGeminiBusinessIncomeLabel(value: boolean | null | undefined): string {
  if (typeof value !== 'boolean') return MISSING
  return value ? '해당' : '해당 없음'
}
